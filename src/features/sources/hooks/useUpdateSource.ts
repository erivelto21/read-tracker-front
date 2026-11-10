import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateSource } from "@/api/sources";
import { queryKeys } from "@/lib/queryKeys";
import type { SourcePatch } from "@/features/sources/types";

export function useUpdateSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SourcePatch }) =>
      updateSource(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sources.all() });
    },
  });
}