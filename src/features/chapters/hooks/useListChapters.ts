import { useQuery } from "@tanstack/react-query";
import { listChapters } from "@/api/chapters";
import { queryKeys } from "@/lib/queryKeys";
import type { ChapterFilter } from "@/features/chapters/types";

export function useListChapters(filter: ChapterFilter) {
  return useQuery({
    queryKey: queryKeys.chapters.list(filter),
    queryFn: () => listChapters(filter),
  });
}