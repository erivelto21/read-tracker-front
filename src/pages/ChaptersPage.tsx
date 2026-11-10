import { useState } from "react";
import { Link } from "react-router-dom";
import { useListChapters } from "@/features/chapters/hooks/useListChapters";
import { useMarkChapterRead } from "@/features/chapters/hooks/useMarkChapterRead";
import { useUnreadCount } from "@/features/chapters/hooks/useUnreadCount";
import { useSourceHealth } from "@/features/chapters/hooks/useSourceHealth";
import { ChapterRow } from "@/features/chapters/components/ChapterRow";
import { SourceHealthNotice } from "@/features/chapters/components/SourceHealthNotice";

export function ChaptersPage(): React.JSX.Element {
  const [unreadOnly, setUnreadOnly] = useState(true);
  const [includeImported, setIncludeImported] = useState(false);

  const { data, isLoading, isError } = useListChapters({
    unread: unreadOnly,
    excludeImported: !includeImported,
    limit: 50,
  });
  const unread = useUnreadCount();
  const sources = useSourceHealth();
  const markRead = useMarkChapterRead();

  const chapters = data?.chapters ?? [];
  const importedCount = (unread.data?.data.total ?? 0) - (unread.data?.data.excludingImported ?? 0);

  return (
    <div className="min-h-screen bg-sky-50 p-6" data-testid="chapters-page">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">New Chapters</h1>
          <nav className="flex items-center gap-4">
            <Link
              to="/titles"
              className="text-sm text-sky-700 hover:underline"
            >
              Back to reading list
            </Link>
            <Link
              to="/sources"
              data-testid="sources-link"
              className="text-sm text-sky-700 hover:underline"
            >
              Sources
            </Link>
          </nav>
        </div>

        <SourceHealthNotice sources={sources.data?.sources ?? []} />

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-wrap gap-4 items-center">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              data-testid="chapters-unread-toggle"
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => {
                setUnreadOnly(e.target.checked);
              }}
              className="accent-sky-600"
            />
            Only unread
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              data-testid="chapters-imported-toggle"
              type="checkbox"
              checked={includeImported}
              onChange={(e) => {
                setIncludeImported(e.target.checked);
              }}
              className="accent-sky-600"
            />
            Show imported
            {importedCount > 0 && (
              <span
                data-testid="chapters-imported-count"
                className="text-xs rounded-full bg-gray-200 text-gray-700 px-2 py-0.5"
              >
                {importedCount}
              </span>
            )}
          </label>
        </div>

        {isLoading && (
          <p data-testid="chapters-loading" className="text-center text-gray-500 py-8">
            Loading chapters…
          </p>
        )}

        {isError && (
          <p
            data-testid="chapters-error"
            className="text-center text-red-600 bg-red-50 border border-red-200 rounded-xl py-4 px-6"
          >
            Failed to load chapters. Please try again.
          </p>
        )}

        {markRead.isError && (
          <p
            data-testid="chapters-mark-error"
            className="text-center text-red-600 bg-red-50 border border-red-200 rounded-xl py-4 px-6"
          >
            Failed to mark the chapter as read. Please try again.
          </p>
        )}

        {!isLoading && !isError && chapters.length === 0 && (
          <p
            data-testid="chapters-empty"
            className="text-center text-gray-500 bg-white border border-gray-200 rounded-xl py-8"
          >
            No chapters to show.
          </p>
        )}

        {!isLoading && !isError && chapters.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-100 text-gray-600 text-sm">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Chapter</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Found</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {chapters.map((chapter, index) => (
                  <ChapterRow
                    key={chapter.id}
                    chapter={chapter}
                    index={index}
                    isMarking={markRead.isPending}
                    onMarkRead={(id) => {
                      markRead.mutate(id);
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}