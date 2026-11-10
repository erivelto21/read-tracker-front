import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChaptersPage } from "@/pages/ChaptersPage";
import { renderWithProviders } from "@/utils/test-utils";
import type { Chapter } from "@/features/chapters/types";

const unreadChapter: Chapter = {
  id: "c1",
  titleId: "t1",
  titleName: "One Piece",
  host: "a.example.com",
  number: 1101,
  numberRaw: "Chapter 1101",
  name: "Chapter 1101",
  url: "https://a.example.com/c/1101",
  discoveredAt: "2026-01-02T15:04:05Z",
  imported: false,
};

const importedChapter: Chapter = {
  ...unreadChapter,
  id: "c2",
  name: "Chapter 1",
  number: 1,
  numberRaw: "Chapter 1",
  imported: true,
};

// The list must reflect a mark-read on the next fetch, otherwise the refetch would keep showing
// the row and the test would pass for the wrong reason.
let markedRead = new Set<string>();

const server = setupServer(
  http.get("*/v1/chapters", ({ request }) => {
    const url = new URL(request.url);
    const excludeImported = url.searchParams.get("exclude_imported") === "true";
    const unreadOnly = url.searchParams.get("unread") === "true";

    let chapters = excludeImported
      ? [unreadChapter]
      : [unreadChapter, importedChapter];
    if (unreadOnly) {
      chapters = chapters.filter((chapter) => !markedRead.has(chapter.id));
    }

    return HttpResponse.json({ chapters });
  }),
  http.get("*/v1/chapters/unread-count", () => {
    return HttpResponse.json({ data: { total: 2, excludingImported: 1 } });
  }),
  http.get("*/v1/sources", () => {
    return HttpResponse.json({ sources: [] });
  }),
  http.patch("*/v1/chapters/:id/read", ({ params }) => {
    markedRead.add(String(params.id));
    return HttpResponse.json({ data: { ...unreadChapter, readAt: "2026-01-03T00:00:00Z" } });
  }),
);

beforeAll(() => {
  server.listen();
});
afterEach(() => {
  server.resetHandlers();
  markedRead = new Set<string>();
});
afterAll(() => {
  server.close();
});

describe("ChaptersPage", () => {
  it("renders the page title", () => {
    renderWithProviders(<ChaptersPage />);
    expect(screen.getByText("New Chapters")).toBeInTheDocument();
  });

  it("shows loading state initially", () => {
    renderWithProviders(<ChaptersPage />);
    expect(screen.getByTestId("chapters-loading")).toBeInTheDocument();
  });

  it("lists discovered chapters", async () => {
    renderWithProviders(<ChaptersPage />);

    await waitFor(() => {
      expect(screen.getByText("Chapter 1101")).toBeInTheDocument();
    });
    expect(screen.getByText("One Piece")).toBeInTheDocument();
  });

  it("excludes imported chapters by default", async () => {
    renderWithProviders(<ChaptersPage />);

    await waitFor(() => {
      expect(screen.getByText("Chapter 1101")).toBeInTheDocument();
    });
    expect(screen.queryByText("Chapter 1")).not.toBeInTheDocument();
  });

  it("shows how many imported chapters are hidden", async () => {
    renderWithProviders(<ChaptersPage />);

    await waitFor(() => {
      expect(screen.getByTestId("chapters-imported-count")).toHaveTextContent("1");
    });
  });

  it("includes imported chapters when the toggle is enabled", async () => {
    renderWithProviders(<ChaptersPage />);

    await waitFor(() => {
      expect(screen.getByText("Chapter 1101")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId("chapters-imported-toggle"));

    await waitFor(() => {
      expect(screen.getByText("Chapter 1")).toBeInTheDocument();
    });
    expect(screen.getByTestId("chapter-imported-badge")).toBeInTheDocument();
  });

  it("shows an empty state when there are no chapters", async () => {
    server.use(
      http.get("*/v1/chapters", () => HttpResponse.json({ chapters: [] })),
    );

    renderWithProviders(<ChaptersPage />);

    await waitFor(() => {
      expect(screen.getByTestId("chapters-empty")).toBeInTheDocument();
    });
  });

  it("shows an error state when the API fails", async () => {
    server.use(
      http.get("*/v1/chapters", () => new HttpResponse(null, { status: 500 })),
    );

    renderWithProviders(<ChaptersPage />);

    await waitFor(() => {
      expect(screen.getByTestId("chapters-error")).toBeInTheDocument();
    });
  });

  it("marks a chapter read", async () => {
    renderWithProviders(<ChaptersPage />);

    await waitFor(() => {
      expect(screen.getByTestId("chapter-mark-read")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId("chapter-mark-read"));

    await waitFor(() => {
      expect(screen.queryByTestId("chapter-mark-read")).not.toBeInTheDocument();
    });
  });

  it("shows an error when marking read fails", async () => {
    server.use(
      http.patch("*/v1/chapters/*/read", () => new HttpResponse(null, { status: 500 })),
    );

    renderWithProviders(<ChaptersPage />);

    await waitFor(() => {
      expect(screen.getByTestId("chapter-mark-read")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId("chapter-mark-read"));

    await waitFor(() => {
      expect(screen.getByTestId("chapters-mark-error")).toBeInTheDocument();
    });
    expect(screen.getByTestId("chapter-mark-read")).toBeInTheDocument();
  });

  it("surfaces a failing source", async () => {
    server.use(
      http.get("*/v1/sources", () =>
        HttpResponse.json({
          sources: [
            {
              host: "broken.example.com",
              name: "Broken Source",
              enabled: true,
              blocked: false,
              failing: true,
              consecutiveFailures: 3,
              lastError: "no chapters parsed",
            },
          ],
        }),
      ),
    );

    renderWithProviders(<ChaptersPage />);

    await waitFor(() => {
      expect(screen.getByTestId("source-health-notice")).toBeInTheDocument();
    });
    expect(screen.getByText(/Broken Source/)).toBeInTheDocument();
  });

  it("shows no source notice when every source is healthy", async () => {
    renderWithProviders(<ChaptersPage />);

    await waitFor(() => {
      expect(screen.getByText("Chapter 1101")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("source-health-notice")).not.toBeInTheDocument();
  });
});