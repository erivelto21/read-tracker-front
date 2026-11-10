import { useMutation, useQueryClient } from "@tanstack/react-query";
import { markChapterRead } from "@/api/chapters";
import { queryKeys } from "@/lib/queryKeys";

// Marking a chapter read changes both the list and the counts, so both are invalidated together:
// a row that stays on screen while the badge says it is gone is worse than a brief refetch.
export function useMarkChapterRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markChapterRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.chapters.all() });
    },
  });
}