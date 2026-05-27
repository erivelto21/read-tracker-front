import type { Title } from "@/features/titles/types";

interface TitleRowProps {
  title: Title;
  index: number;
  onClick?: (id: string) => void;
}

function formatProgress(chapter?: number, page?: number): string {
  if (chapter !== undefined && page !== undefined)
    return `Ch. ${String(chapter)}, P. ${String(page)}`;
  if (chapter !== undefined) return `Ch. ${String(chapter)}`;
  if (page !== undefined) return `P. ${String(page)}`;
  return "—";
}

export function TitleRow({
  title,
  index,
  onClick,
}: TitleRowProps): React.JSX.Element {
  const isEven = index % 2 === 0;

  return (
    <tr
      data-testid="title-row"
      onClick={() => {
        onClick?.(title.id);
      }}
      className={`
        ${isEven ? "bg-white" : "bg-gray-50/60"}
        hover:bg-sky-50 transition-colors
        ${onClick ? "cursor-pointer" : ""}
      `}
    >
      <td className="px-4 py-3 text-gray-900 font-medium">{title.name}</td>
      <td className="px-4 py-3 text-gray-600 capitalize">{title.type}</td>
      <td className="px-4 py-3 text-gray-600 text-right tabular-nums">
        {formatProgress(title.chapter, title.page)}
      </td>
      <td className="px-3 py-3 w-28">
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
          Reading
        </span>
      </td>
    </tr>
  );
}
