import type { Chapter } from "@/features/chapters/types";

interface ChapterRowProps {
  chapter: Chapter;
  index: number;
  onMarkRead: (id: string) => void;
  isMarking: boolean;
}

// Discovery time is what the reader cares about ("when did this appear?"), so it is rendered in
// the reader's locale rather than as a raw timestamp.
function formatDiscovered(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

export function ChapterRow({
  chapter,
  index,
  onMarkRead,
  isMarking,
}: ChapterRowProps): React.JSX.Element {
  const isEven = index % 2 === 0;

  return (
    <tr
      data-testid="chapter-row"
      className={`${isEven ? "bg-white" : "bg-gray-50"} ${
        chapter.imported ? "text-gray-500" : "text-gray-900"
      }`}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-medium">{chapter.titleName || "—"}</span>
          {chapter.imported && (
            <span
              data-testid="chapter-imported-badge"
              className="text-xs rounded-full bg-gray-200 text-gray-700 px-2 py-0.5"
            >
              imported
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <a
          href={chapter.url}
          target="_blank"
          rel="noreferrer"
          className="text-sky-700 hover:underline"
        >
          {chapter.name}
        </a>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{chapter.host}</td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {formatDiscovered(chapter.discoveredAt)}
      </td>
      <td className="px-4 py-3 text-right">
        {chapter.readAt ? (
          <span className="text-sm text-gray-400">Read</span>
        ) : (
          <button
            data-testid="chapter-mark-read"
            type="button"
            disabled={isMarking}
            onClick={() => {
              onMarkRead(chapter.id);
            }}
            className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1 text-sm text-sky-700 hover:bg-sky-100 disabled:opacity-50 transition-colors"
          >
            {isMarking ? "Marking…" : "Mark read"}
          </button>
        )}
      </td>
    </tr>
  );
}