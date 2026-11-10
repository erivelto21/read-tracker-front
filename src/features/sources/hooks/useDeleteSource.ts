import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteSource } from "@/api/sources";
import { queryKeys } from "@/lib/queryKeys";

export function useDeleteSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSource(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sources.all() });
    },
  });
}