import { useState } from "react";
import { Link } from "react-router-dom";
import { useListSources } from "@/features/sources/hooks/useListSources";
import { SourceTable } from "@/features/sources/components/SourceTable";
import { SourceFormModal } from "@/features/sources/components/SourceFormModal";
import type { Source } from "@/features/sources/types";

export function SourcesPage(): React.JSX.Element {
  // `undefined` means closed; a `null` source means the create form. Using one piece of state for
  // both keeps "which modal is open" from being two flags that can disagree.
  const [editing, setEditing] = useState<Source | null | undefined>(undefined);

  const { data, isLoading, isError } = useListSources();
  const sources = data?.sources ?? [];

  const brokenCount = sources.filter((s) => s.blocked || s.failing).length;

  return (
    <div className="min-h-screen bg-sky-50 p-6" data-testid="sources-page">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sources</h1>
            <p className="text-sm text-gray-500">
              Sites the crawler reads. Changes take effect on the next run.
            </p>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              to="/titles"
              className="text-sky-700 hover:underline"
              data-testid="nav-titles"
            >
              Reading list
            </Link>
            <Link
              to="/chapters"
              className="text-sky-700 hover:underline"
              data-testid="nav-chapters"
            >
              New chapters
            </Link>
          </nav>
        </div>

        {brokenCount > 0 && !isLoading && (
          <div
            data-testid="sources-broken-summary"
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            {brokenCount === 1
              ? "One source is not being read."
              : `${String(brokenCount)} sources are not being read.`}{" "}
            Their titles have no new chapters until it is fixed.
          </div>
        )}

        {isLoading && (
          <p
            data-testid="sources-loading"
            className="text-center text-gray-500 py-8"
          >
            Loading sources…
          </p>
        )}

        {isError && (
          <p
            data-testid="sources-error"
            className="text-center text-red-600 bg-red-50 border border-red-200 rounded-xl py-4 px-6"
          >
            Failed to load sources. Please try again.
          </p>
        )}

        {!isLoading && !isError && (
          <SourceTable
            sources={sources}
            onAdd={() => {
              setEditing(null);
            }}
            onEdit={(source) => {
              setEditing(source);
            }}
          />
        )}

        {editing !== undefined && (
          <SourceFormModal
            source={editing ?? undefined}
            onClose={() => {
              setEditing(undefined);
            }}
          />
        )}
      </div>
    </div>
  );
}