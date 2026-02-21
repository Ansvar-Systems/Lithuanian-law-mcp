/**
 * Response metadata utilities for Lithuanian Law MCP.
 */

import type Database from '@ansvar/mcp-sqlite';

export interface ResponseMetadata {
  data_source: string;
  jurisdiction: string;
  disclaimer: string;
  freshness?: string;
}

export interface ToolResponse<T> {
  results: T;
  _metadata: ResponseMetadata;
}

export function generateResponseMetadata(
  db: InstanceType<typeof Database>,
): ResponseMetadata {
  let freshness: string | undefined;
  try {
    const row = db.prepare(
      "SELECT value FROM db_metadata WHERE key = 'built_at'"
    ).get() as { value: string } | undefined;
    if (row) freshness = row.value;
  } catch {
    // Ignore
  }

  return {
    data_source: 'TAR (Teisės aktų registras) (www.e-tar.lt) — Seimas of the Republic of Lithuania',
    jurisdiction: 'LT',
    disclaimer:
      'This data is sourced from the TAR (Teisės aktų registras) under public domain. ' +
      'The authoritative versions are maintained by the Seimas of the Republic of Lithuania. ' +
      'Always verify with the official TAR (Teisės aktų registras) portal (www.e-tar.lt).',
    freshness,
  };
}
