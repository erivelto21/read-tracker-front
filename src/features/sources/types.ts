export const SOURCE_STRATEGIES = ["feed", "css", "json"] as const;
export type SourceStrategy = (typeof SOURCE_STRATEGIES)[number];

export interface Source {
  id: string;
  host: string;
  name: string;
  urlPattern: string;
  priority: number;
  strategy: SourceStrategy;
  enabled: boolean;
  delayMs: number;
  profile: string;
  listUrl: string;
  feedUrl: string;
  jsonUrl: string;
  jsonPath: string;
  itemSelector: string;
  titleSelector: string;
  linkAttr: string;
  dateSelector: string;
  numberPattern: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  lastRunAt?: string;
  lastOkAt?: string;
  lastError?: string;
  consecutiveFailures: number;
  blocked: boolean;
  failing: boolean;
  itemsFound: number;
  validatedAt?: string;
}

/**
 * The fields an operator may write. Runtime health is deliberately absent: it belongs to the
 * crawler, and sending it would be rejected rather than silently ignored.
 */
export interface SourcePayload {
  host: string;
  name: string;
  urlPattern: string;
  priority: number;
  strategy: SourceStrategy;
  enabled: boolean;
  delayMs: number;
  profile: string;
  listUrl?: string;
  feedUrl?: string;
  jsonUrl?: string;
  jsonPath?: string;
  itemSelector?: string;
  titleSelector?: string;
  linkAttr?: string;
  dateSelector?: string;
  numberPattern?: string;
}

export type SourcePatch = Partial<SourcePayload>;