import { useState } from "react";
import { clsx } from "clsx";
import type { Source } from "@/features/sources/types";
import { useDeleteSource } from "@/features/sources/hooks/useDeleteSource";
import { ConfirmDialog } from "@/features/titles/components/ConfirmDialog";

interface SourceTableProps {
  sources: Source[];
  onEdit: (source: Source) => void;
  onAdd: () => void;
}

// A source's health is not a detail: a failing source looks exactly like a source with no new
// chapters, so the row says which it is.
function HealthBadge({ source }: { source: Source }): React.JSX.Element {
  if (source.blocked) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
        Blocked
      </span>
    );
  }
  if (source.failing) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
        Failing ({source.consecutiveFailures})
      </span>
    );
  }
  if (source.lastOkAt) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
        Healthy
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
      Never run
    </span>
  );
}

function formatTimestamp(value?: string): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString();
}

export function SourceTable({
  sources,
  onEdit,
  onAdd,
}: SourceTableProps): React.JSX.Element {
  const { mutate: remove, isPending, variables: deletingId } = useDeleteSource();
  const [pendingDelete, setPendingDelete] = useState<Source | null>(null);

  return (
    <>
      <div
        data-testid="source-table"
        className="rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-[#f0f0f0]">
          <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
            Sources
          </span>
          <button
            type="button"
            data-testid="add-source-btn"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            <span aria-hidden="true">+</span>
            Add Source
          </button>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f0f0f0] text-gray-600 border-b border-gray-200">
              <th className="px-4 py-2.5 text-left font-semibold">Name</th>
              <th className="px-4 py-2.5 text-left font-semibold">Host</th>
              <th className="px-4 py-2.5 text-left font-semibold">Strategy</th>
              <th className="px-4 py-2.5 text-left font-semibold">Health</th>
              <th className="px-4 py-2.5 text-left font-semibold">Last success</th>
              <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sources.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  data-testid="source-table-empty"
                  className="px-4 py-8 text-center text-gray-500"
                >
                  No sources yet. Add one to start crawling.
                </td>
              </tr>
            )}

            {sources.map((source) => (
              <tr
                key={source.id}
                data-testid={`source-row-${source.host}`}
                className="border-b border-gray-100 last:border-0 hover:bg-sky-50/50 transition-colors"
              >
                <td className="px-4 py-2.5">
                  <span className="font-medium text-gray-900">
                    {source.name || source.host}
                  </span>
                  {!source.enabled && (
                    <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                      disabled
                    </span>
                  )}
                  {source.lastError && (
                    <p className="mt-0.5 text-xs text-red-600 truncate max-w-xs">
                      {source.lastError}
                    </p>
                  )}
                </td>
                <td className="px-4 py-2.5 text-gray-600">{source.host}</td>
                <td className="px-4 py-2.5">
                  <span className="rounded bg-sky-50 px-1.5 py-0.5 text-xs font-medium uppercase text-sky-700">
                    {source.strategy}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <HealthBadge source={source} />
                </td>
                <td className="px-4 py-2.5 text-gray-600">
                  {formatTimestamp(source.lastOkAt)}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <div className="inline-flex gap-2">
                    <button
                      type="button"
                      data-testid={`edit-source-${source.host}`}
                      onClick={() => {
                        onEdit(source);
                      }}
                      className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      data-testid={`delete-source-${source.host}`}
                      onClick={() => {
                        setPendingDelete(source);
                      }}
                      disabled={isPending && deletingId === source.id}
                      className={clsx(
                        "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                        isPending && deletingId === source.id
                          ? "border-red-200 text-red-300 cursor-not-allowed"
                          : "border-red-200 text-red-600 hover:bg-red-50",
                      )}
                    >
                      {isPending && deletingId === source.id
                        ? "Deleting…"
                        : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pendingDelete && (
        <ConfirmDialog
          titleName={pendingDelete.name || pendingDelete.host}
          isPending={isPending}
          onCancel={() => {
            setPendingDelete(null);
          }}
          onConfirm={() => {
            remove(pendingDelete.id, {
              onSettled: () => {
                setPendingDelete(null);
              },
            });
          }}
        />
      )}
    </>
  );
}