export interface Chapter {
  id: string;
  titleId: string;
  titleName: string;
  host: string;
  number: number | null;
  numberRaw: string;
  name: string;
  url: string;
  publishedAt?: string;
  discoveredAt: string;
  readAt?: string;
  imported: boolean;
}

export interface ChapterFilter {
  unread: boolean;
  excludeImported: boolean;
  titleId?: string;
  host?: string;
  cursor?: string;
  limit?: number;
}

export interface ChaptersPage {
  chapters: Chapter[];
  nextCursor?: string;
}

export interface UnreadCount {
  total: number;
  excludingImported: number;
}

export interface SourceHealth {
  host: string;
  name: string;
  enabled: boolean;
  blocked: boolean;
  failing: boolean;
  consecutiveFailures: number;
  lastOkAt?: string;
  lastError?: string;
}