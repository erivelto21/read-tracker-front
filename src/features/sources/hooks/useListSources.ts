import { useQuery } from "@tanstack/react-query";
import { listSources } from "@/api/sources";
import { queryKeys } from "@/lib/queryKeys";

export function useListSources() {
  return useQuery({
    queryKey: queryKeys.sources.all(),
    queryFn: listSources,
  });
}