import { client } from "./client";
import type {
  Chapter,
  ChapterFilter,
  ChaptersPage,
  UnreadCount,
} from "@/features/chapters/types";

export async function listChapters(
  filter: ChapterFilter,
): Promise<ChaptersPage> {
  const params: Record<string, string> = {};
  if (filter.unread) params["unread"] = "true";
  if (filter.excludeImported) params["exclude_imported"] = "true";
  if (filter.titleId) params["title_id"] = filter.titleId;
  if (filter.host) params["host"] = filter.host;
  if (filter.cursor) params["cursor"] = filter.cursor;
  if (filter.limit) params["limit"] = String(filter.limit);

  const { data } = await client.get<ChaptersPage>("v1/chapters", { params });
  return data;
}

export async function markChapterRead(
  id: string,
): Promise<{ data: Chapter }> {
  const { data } = await client.patch<{ data: Chapter }>(
    `v1/chapters/${id}/read`,
  );
  return data;
}

export async function getUnreadCount(
  titleId?: string,
): Promise<{ data: UnreadCount }> {
  const params: Record<string, string> = {};
  if (titleId) params["title_id"] = titleId;

  const { data } = await client.get<{ data: UnreadCount }>(
    "v1/chapters/unread-count",
    { params },
  );
  return data;
}