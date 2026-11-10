import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  beforeEach,
} from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SourcesPage } from "@/pages/SourcesPage";
import { renderWithProviders } from "@/utils/test-utils";
import type { Source } from "@/features/sources/types";

// userEvent.type parses "[", "{" and friends as key descriptors, which mangles a regular
// expression. Pasting inserts the text literally.
async function typeRaw(
  user: ReturnType<typeof userEvent.setup>,
  element: HTMLElement,
  text: string,
): Promise<void> {
  await user.click(element);
  await user.paste(text);
}

function makeSource(overrides: Partial<Source> = {}): Source {
  return {
    id: "s1",
    host: "a.example.com",
    name: "Source A",
    urlPattern: "^https://a\\.example\\.com/manga/[^/]+$",
    priority: 10,
    strategy: "feed",
    enabled: true,
    delayMs: 500,
    profile: "chrome",
    listUrl: "",
    feedUrl: "https://a.example.com/feed.xml",
    jsonUrl: "",
    jsonPath: "",
    itemSelector: "",
    titleSelector: "",
    linkAttr: "",
    dateSelector: "",
    numberPattern: "",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    updatedBy: "tracker-api",
    consecutiveFailures: 0,
    blocked: false,
    failing: false,
    itemsFound: 0,
    ...overrides,
  };
}

// The list is stateful so a create or delete is visible on the next fetch; otherwise the refetch
// would keep returning the seed data and the test could pass for the wrong reason.
let sources: Source[] = [];
let nextId = 1;
let lastCreatedBody: Record<string, unknown> | null = null;

const server = setupServer(
  http.get("*/v1/sources", () => HttpResponse.json({ sources })),
  http.post("*/v1/sources", async ({ request }) => {
    lastCreatedBody = (await request.json()) as Record<string, unknown>;
    const created = makeSource({
      id: `s${String(++nextId)}`,
      ...(lastCreatedBody as Partial<Source>),
    });
    sources = [...sources, created];
    return HttpResponse.json({ data: created }, { status: 201 });
  }),
  http.patch("*/v1/sources/:id", async ({ params, request }) => {
    const body = (await request.json()) as Partial<Source>;
    sources = sources.map((s) =>
      s.id === String(params.id) ? { ...s, ...body } : s,
    );
    return HttpResponse.json({ data: sources.find((s) => s.id === String(params.id)) });
  }),
  http.delete("*/v1/sources/:id", ({ params }) => {
    sources = sources.filter((s) => s.id !== String(params.id));
    return new HttpResponse(null, { status: 204 });
  }),
);

beforeAll(() => {
  server.listen();
});
beforeEach(() => {
  sources = [makeSource()];
  nextId = 1;
  lastCreatedBody = null;
});
afterEach(() => {
  server.resetHandlers();
});
afterAll(() => {
  server.close();
});

describe("SourcesPage", () => {
  it("renders the page title", () => {
    renderWithProviders(<SourcesPage />);
    expect(screen.getByText("Sources")).toBeInTheDocument();
  });

  it("lists the configured sources", async () => {
    renderWithProviders(<SourcesPage />);

    expect(await screen.findByText("Source A")).toBeInTheDocument();
    expect(screen.getByText("a.example.com")).toBeInTheDocument();
    expect(screen.getByText("feed")).toBeInTheDocument();
  });

  it("shows an empty state when no source is configured", async () => {
    sources = [];
    renderWithProviders(<SourcesPage />);

    expect(await screen.findByTestId("source-table-empty")).toBeInTheDocument();
  });

  it("reports a failing source instead of hiding it behind an empty list", async () => {
    sources = [makeSource({ failing: true, consecutiveFailures: 3 })];
    renderWithProviders(<SourcesPage />);

    expect(await screen.findByText("Failing (3)")).toBeInTheDocument();
    expect(screen.getByTestId("sources-broken-summary")).toBeInTheDocument();
  });

  it("distinguishes a blocked source from a failing one", async () => {
    sources = [makeSource({ blocked: true })];
    renderWithProviders(<SourcesPage />);

    expect(await screen.findByText("Blocked")).toBeInTheDocument();
  });

  it("marks a source that has never run", async () => {
    renderWithProviders(<SourcesPage />);

    expect(await screen.findByText("Never run")).toBeInTheDocument();
  });

  it("creates a source through the form", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SourcesPage />);

    await user.click(await screen.findByTestId("add-source-btn"));

    await user.type(screen.getByTestId("source-field-host"), "b.example.com");
    await user.type(screen.getByTestId("source-field-name"), "Source B");
    await typeRaw(
      user,
      screen.getByTestId("source-field-urlPattern"),
      "^https://b\\.example\\.com/manga/[^/]+$",
    );
    await user.type(
      screen.getByTestId("source-field-feedUrl"),
      "https://b.example.com/feed.xml",
    );
    await user.click(screen.getByRole("button", { name: "Add source" }));

    await waitFor(() => {
      expect(screen.queryByTestId("source-form-modal")).not.toBeInTheDocument();
    });
    expect(await screen.findByText("Source B")).toBeInTheDocument();
  });

  it("sends only the fields the chosen strategy uses", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SourcesPage />);

    await user.click(await screen.findByTestId("add-source-btn"));
    await user.click(screen.getByRole("button", { name: "JSON" }));

    await user.type(screen.getByTestId("source-field-host"), "c.example.com");
    await user.type(screen.getByTestId("source-field-name"), "Source C");
    await typeRaw(
      user,
      screen.getByTestId("source-field-urlPattern"),
      "^https://c\\.example\\.com/manga/[^/]+$",
    );
    await user.type(
      screen.getByTestId("source-field-jsonUrl"),
      "https://c.example.com/api/chapters",
    );
    await typeRaw(user, screen.getByTestId("source-field-jsonPath"), "$.chapters[*]");
    await user.click(screen.getByRole("button", { name: "Add source" }));

    await waitFor(() => {
      expect(lastCreatedBody).not.toBeNull();
    });
    expect(lastCreatedBody?.["strategy"]).toBe("json");
    expect(lastCreatedBody?.["jsonPath"]).toBe("$.chapters[*]");
    // A feed URL left over from another strategy must not travel with a json source.
    expect(lastCreatedBody).not.toHaveProperty("feedUrl");
  });

  it("blocks a submit that omits a field the strategy requires", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SourcesPage />);

    await user.click(await screen.findByTestId("add-source-btn"));
    await user.type(screen.getByTestId("source-field-host"), "d.example.com");
    await user.click(screen.getByRole("button", { name: "Add source" }));

    // Several required fields are empty at once, so the message appears more than once.
    expect(
      (await screen.findAllByText("This field is required")).length,
    ).toBeGreaterThan(0);
    expect(lastCreatedBody).toBeNull();
    expect(screen.getByTestId("source-form-modal")).toBeInTheDocument();
  });

  it("maps a server field error onto the offending input", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("*/v1/sources", () =>
        HttpResponse.json(
          {
            error: {
              code: "BAD_REQUEST",
              message: "Bad Request",
              details: [{ field: "feedUrl", message: "is required for the feed strategy" }],
            },
          },
          { status: 400 },
        ),
      ),
    );

    renderWithProviders(<SourcesPage />);
    await user.click(await screen.findByTestId("add-source-btn"));

    await user.type(screen.getByTestId("source-field-host"), "e.example.com");
    await user.type(screen.getByTestId("source-field-name"), "Source E");
    await typeRaw(
      user,
      screen.getByTestId("source-field-urlPattern"),
      "^https://e\\.example\\.com/manga/[^/]+$",
    );
    await user.type(
      screen.getByTestId("source-field-feedUrl"),
      "https://e.example.com/feed.xml",
    );
    await user.click(screen.getByRole("button", { name: "Add source" }));

    expect(
      await screen.findByText("is required for the feed strategy"),
    ).toBeInTheDocument();
  });

  it("reports a duplicate source as a conflict", async () => {
    const user = userEvent.setup();
    server.use(
      http.post("*/v1/sources", () =>
        HttpResponse.json(
          {
            error: {
              code: "CONFLICT",
              message: "a source with this host and url pattern already exists",
            },
          },
          { status: 409 },
        ),
      ),
    );

    renderWithProviders(<SourcesPage />);
    await user.click(await screen.findByTestId("add-source-btn"));

    await user.type(screen.getByTestId("source-field-host"), "a.example.com");
    await user.type(screen.getByTestId("source-field-name"), "Source A");
    await typeRaw(
      user,
      screen.getByTestId("source-field-urlPattern"),
      "^https://a\\.example\\.com/manga/[^/]+$",
    );
    await user.type(
      screen.getByTestId("source-field-feedUrl"),
      "https://a.example.com/feed.xml",
    );
    await user.click(screen.getByRole("button", { name: "Add source" }));

    expect(await screen.findByTestId("source-form-error")).toHaveTextContent(
      "already exists",
    );
  });

  it("edits an existing source", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SourcesPage />);

    await user.click(await screen.findByTestId("edit-source-a.example.com"));

    const nameInput = screen.getByTestId("source-field-name");
    await user.clear(nameInput);
    await user.type(nameInput, "Renamed Source");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(screen.queryByTestId("source-form-modal")).not.toBeInTheDocument();
    });
    expect(await screen.findByText("Renamed Source")).toBeInTheDocument();
  });

  it("asks for confirmation before deleting a source", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SourcesPage />);

    await user.click(await screen.findByTestId("delete-source-a.example.com"));

    expect(screen.getByText(/Delete .*Source A.*\?/)).toBeInTheDocument();

    // Cancelling must leave the row in place.
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByText("Source A")).toBeInTheDocument();

    await user.click(screen.getByTestId("delete-source-a.example.com"));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "Delete" }),
    );

    expect(await screen.findByTestId("source-table-empty")).toBeInTheDocument();
  });

  it("surfaces a load failure", async () => {
    server.use(
      http.get("*/v1/sources", () => new HttpResponse(null, { status: 500 })),
    );

    renderWithProviders(<SourcesPage />);

    expect(await screen.findByTestId("sources-error")).toBeInTheDocument();
  });
});