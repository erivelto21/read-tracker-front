import { useQuery } from "@tanstack/react-query";
import { getUnreadCount } from "@/api/chapters";
import { queryKeys } from "@/lib/queryKeys";

export function useUnreadCount(titleId?: string) {
  return useQuery({
    queryKey: queryKeys.chapters.unreadCount(titleId),
    queryFn: () => getUnreadCount(titleId),
  });
}