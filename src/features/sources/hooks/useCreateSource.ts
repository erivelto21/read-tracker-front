import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSource } from "@/api/sources";
import { queryKeys } from "@/lib/queryKeys";

export function useCreateSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSource,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sources.all() });
    },
  });
}