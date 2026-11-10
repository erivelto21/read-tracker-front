import { client } from "./client";
import type { Source, SourcePatch, SourcePayload } from "@/features/sources/types";

export async function listSources(): Promise<{ sources: Source[] }> {
  const { data } = await client.get<{ sources: Source[] }>("v1/sources");
  return data;
}

export async function getSource(id: string): Promise<{ data: Source }> {
  const { data } = await client.get<{ data: Source }>(`v1/sources/${id}`);
  return data;
}

export async function createSource(
  payload: SourcePayload,
): Promise<{ data: Source }> {
  const { data } = await client.post<{ data: Source }>("v1/sources", payload);
  return data;
}

export async function updateSource(
  id: string,
  payload: SourcePatch,
): Promise<{ data: Source }> {
  const { data } = await client.patch<{ data: Source }>(
    `v1/sources/${id}`,
    payload,
  );
  return data;
}

export async function deleteSource(id: string): Promise<void> {
  await client.delete(`v1/sources/${id}`);
}