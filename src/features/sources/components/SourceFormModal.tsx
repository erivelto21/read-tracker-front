import { useEffect, useState } from "react";
import axios from "axios";
import { clsx } from "clsx";
import { SegmentedControl } from "@/components/SegmentedControl";
import {
  SOURCE_STRATEGIES,
  type Source,
  type SourcePayload,
  type SourceStrategy,
} from "@/features/sources/types";
import { useCreateSource } from "@/features/sources/hooks/useCreateSource";
import { useUpdateSource } from "@/features/sources/hooks/useUpdateSource";

interface SourceFormModalProps {
  /** The source being edited; omitted when creating. */
  source?: Source;
  onClose: () => void;
}

type FieldKey =
  | "host"
  | "name"
  | "urlPattern"
  | "profile"
  | "priority"
  | "delayMs"
  | "listUrl"
  | "feedUrl"
  | "jsonUrl"
  | "jsonPath"
  | "itemSelector"
  | "titleSelector"
  | "linkAttr"
  | "dateSelector"
  | "numberPattern";

type FieldValues = Record<FieldKey, string>;

interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

const FIELD_LABELS: Record<FieldKey, string> = {
  host: "Host",
  name: "Name",
  urlPattern: "URL pattern",
  profile: "TLS profile",
  priority: "Priority",
  delayMs: "Delay (ms)",
  listUrl: "List URL",
  feedUrl: "Feed URL",
  jsonUrl: "JSON URL",
  jsonPath: "JSON path",
  itemSelector: "Item selector",
  titleSelector: "Title selector",
  linkAttr: "Link attribute",
  dateSelector: "Date selector",
  numberPattern: "Number pattern",
};

// Fields shared by every strategy, followed by the ones the strategy requires.
const COMMON_FIELDS: FieldKey[] = [
  "host",
  "name",
  "urlPattern",
  "profile",
  "priority",
  "delayMs",
  "numberPattern",
];

function strategyFields(strategy: SourceStrategy): FieldKey[] {
  switch (strategy) {
    case "feed":
      return ["feedUrl"];
    case "css":
      return ["listUrl", "itemSelector", "titleSelector", "linkAttr", "dateSelector"];
    case "json":
      return ["jsonUrl", "jsonPath"];
  }
}

// Mirrors domain.ValidateSource: the server is the authority, but telling the operator before
// the round trip saves them a rejected request for a field they can see is empty.
function requiredFields(strategy: SourceStrategy): FieldKey[] {
  switch (strategy) {
    case "feed":
      return ["host", "name", "urlPattern", "profile", "feedUrl"];
    case "css":
      return [
        "host",
        "name",
        "urlPattern",
        "profile",
        "listUrl",
        "itemSelector",
        "titleSelector",
        "linkAttr",
      ];
    case "json":
      return ["host", "name", "urlPattern", "profile", "jsonUrl", "jsonPath"];
  }
}

function emptyValues(): FieldValues {
  return {
    host: "",
    name: "",
    urlPattern: "",
    profile: "chrome",
    priority: "0",
    delayMs: "0",
    listUrl: "",
    feedUrl: "",
    jsonUrl: "",
    jsonPath: "",
    itemSelector: "",
    titleSelector: "",
    linkAttr: "",
    dateSelector: "",
    numberPattern: "",
  };
}

function valuesFromSource(source: Source): FieldValues {
  return {
    host: source.host,
    name: source.name,
    urlPattern: source.urlPattern,
    profile: source.profile,
    priority: String(source.priority),
    delayMs: String(source.delayMs),
    listUrl: source.listUrl,
    feedUrl: source.feedUrl,
    jsonUrl: source.jsonUrl,
    jsonPath: source.jsonPath,
    itemSelector: source.itemSelector,
    titleSelector: source.titleSelector,
    linkAttr: source.linkAttr,
    dateSelector: source.dateSelector,
    numberPattern: source.numberPattern,
  };
}

function toPayload(
  values: FieldValues,
  strategy: SourceStrategy,
  enabled: boolean,
): SourcePayload {
  // Only the fields the strategy uses are sent. A css source carrying a stale feedUrl would be
  // stored and then ignored, which is exactly the kind of quiet inconsistency this screen exists
  // to prevent.
  const payload: SourcePayload = {
    host: values.host.trim(),
    name: values.name.trim(),
    urlPattern: values.urlPattern.trim(),
    profile: values.profile.trim(),
    priority: Number(values.priority) || 0,
    delayMs: Number(values.delayMs) || 0,
    strategy,
    enabled,
  };

  if (values.numberPattern.trim()) {
    payload.numberPattern = values.numberPattern.trim();
  }

  switch (strategy) {
    case "feed":
      payload.feedUrl = values.feedUrl.trim();
      break;
    case "css":
      payload.listUrl = values.listUrl.trim();
      payload.itemSelector = values.itemSelector.trim();
      payload.titleSelector = values.titleSelector.trim();
      payload.linkAttr = values.linkAttr.trim();
      if (values.dateSelector.trim()) {
        payload.dateSelector = values.dateSelector.trim();
      }
      break;
    case "json":
      payload.jsonUrl = values.jsonUrl.trim();
      payload.jsonPath = values.jsonPath.trim();
      break;
  }

  return payload;
}

export function SourceFormModal({
  source,
  onClose,
}: SourceFormModalProps): React.JSX.Element {
  const isEdit = source !== undefined;

  const [strategy, setStrategy] = useState<SourceStrategy>(
    source?.strategy ?? "feed",
  );
  const [enabled, setEnabled] = useState(source?.enabled ?? true);
  const [values, setValues] = useState<FieldValues>(
    source ? valuesFromSource(source) : emptyValues(),
  );
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FieldKey, string>>
  >({});
  const [topLevelError, setTopLevelError] = useState<string | null>(null);

  const create = useCreateSource();
  const update = useUpdateSource();
  const isPending = create.isPending || update.isPending;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  function handleFieldChange(key: FieldKey, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        Reflect.deleteProperty(next, key);
        return next;
      });
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const missing: Partial<Record<FieldKey, string>> = {};
    for (const key of requiredFields(strategy)) {
      if (!values[key].trim()) {
        missing[key] = "This field is required";
      }
    }
    if (Object.keys(missing).length > 0) {
      setFieldErrors(missing);
      return;
    }

    setTopLevelError(null);
    setFieldErrors({});

    const payload = toPayload(values, strategy, enabled);
    const onError = (err: unknown) => {
      if (axios.isAxiosError(err)) {
        const body = err.response?.data as ApiErrorBody | undefined;
        if (err.response?.status === 409) {
          setTopLevelError(body?.error.message ?? "This source already exists.");
          return;
        }
        if (body?.error.details && body.error.details.length > 0) {
          const mapped: Partial<Record<FieldKey, string>> = {};
          for (const detail of body.error.details) {
            // The server answers with the JSON field name, which is the form key.
            mapped[detail.field as FieldKey] = detail.message;
          }
          setFieldErrors(mapped);
          return;
        }
      }
      setTopLevelError("An unexpected error occurred. Please try again.");
    };

    if (isEdit) {
      update.mutate(
        { id: source.id, payload },
        { onSuccess: onClose, onError },
      );
      return;
    }
    create.mutate(payload, { onSuccess: onClose, onError });
  }

  const visible: FieldKey[] = [...COMMON_FIELDS, ...strategyFields(strategy)];
  const required = requiredFields(strategy);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        data-testid="source-form-modal"
        className="relative bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none"
        >
          ✕
        </button>

        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          {isEdit ? "Edit source" : "Add a source"}
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          Changes are picked up by the next crawl.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <span className="block text-sm font-medium text-gray-700 mb-2">
              Strategy
            </span>
            <SegmentedControl<SourceStrategy>
              data-testid="source-strategy"
              options={SOURCE_STRATEGIES.map((s) => ({
                value: s,
                label: s.toUpperCase(),
              }))}
              value={strategy}
              onChange={(next) => {
                setStrategy(next);
                setFieldErrors({});
              }}
            />
          </div>

          {topLevelError && (
            <div
              data-testid="source-form-error"
              className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800"
            >
              {topLevelError}
            </div>
          )}

          <div className="space-y-3">
            {visible.map((key) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {FIELD_LABELS[key]}
                  {required.includes(key) && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                <input
                  data-testid={`source-field-${key}`}
                  type={
                    key === "priority" || key === "delayMs" ? "number" : "text"
                  }
                  value={values[key]}
                  onChange={(e) => {
                    handleFieldChange(key, e.target.value);
                  }}
                  autoFocus={key === "host"}
                  className={clsx(
                    "w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-colors",
                    fieldErrors[key]
                      ? "border-red-400 bg-red-50"
                      : "border-gray-200 bg-gray-50 focus:bg-white",
                  )}
                />
                {fieldErrors[key] && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors[key]}</p>
                )}
              </div>
            ))}
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
            <input
              data-testid="source-enabled"
              type="checkbox"
              checked={enabled}
              onChange={(e) => {
                setEnabled(e.target.checked);
              }}
              className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-400"
            />
            Enabled
          </label>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={clsx(
                "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                isPending
                  ? "bg-sky-300 text-white cursor-not-allowed"
                  : "bg-sky-500 text-white hover:bg-sky-600",
              )}
            >
              {isPending ? "Saving…" : isEdit ? "Save changes" : "Add source"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}