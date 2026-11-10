import type { SourceHealth } from "@/features/chapters/types";

interface SourceHealthNoticeProps {
  sources: SourceHealth[];
}

// A source that stopped working is indistinguishable from a source with no new chapters unless it
// is said out loud. This is that sentence.
export function SourceHealthNotice({
  sources,
}: SourceHealthNoticeProps): React.JSX.Element | null {
  const broken = sources.filter((s) => s.blocked || s.failing);
  if (broken.length === 0) return null;

  return (
    <div
      data-testid="source-health-notice"
      className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900"
    >
      <p className="font-medium">
        {broken.length === 1
          ? "One source is not being read"
          : `${String(broken.length)} sources are not being read`}
      </p>
      <ul className="mt-2 space-y-1 text-sm">
        {broken.map((source) => (
          <li key={source.host}>
            <span className="font-medium">{source.name || source.host}</span>
            {source.blocked && " — blocked by the source"}
            {!source.blocked && source.failing && ` — ${String(source.consecutiveFailures)} consecutive failures`}
            {source.lastError && `: ${source.lastError}`}
          </li>
        ))}
      </ul>
    </div>
  );
}