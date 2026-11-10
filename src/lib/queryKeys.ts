import type { TitleFilter } from "@/features/titles/types";
import type { ChapterFilter } from "@/features/chapters/types";

export const queryKeys = {
  titles: {
    all: () => ["titles"] as const,
    list: (filter: TitleFilter) => ["titles", "list", filter] as const,
  },
  chapters: {
    all: () => ["chapters"] as const,
    list: (filter: ChapterFilter) => ["chapters", "list", filter] as const,
    unreadCount: (titleId?: string) =>
      ["chapters", "unread-count", titleId ?? "all"] as const,
  },
  sources: {
    all: () => ["sources"] as const,
    detail: (id: string) => ["sources", "detail", id] as const,
  },
} as const;