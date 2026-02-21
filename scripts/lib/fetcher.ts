/**
 * TAR open-data fetcher for Lithuanian legislation.
 *
 * Official source:
 * - https://get.data.gov.lt/datasets/gov/lrsk/teises_aktai
 *
 * This fetcher reads:
 * - Dokumentas (law-level metadata)
 * - Suvestine (consolidated edition metadata and text)
 */

const API_BASE = 'https://get.data.gov.lt/datasets/gov/lrsk/teises_aktai';
const USER_AGENT = 'Ansvar-Law-MCP/1.0 (legal-data-ingestion)';
const MIN_DELAY_MS = 1200;

let lastRequestAt = 0;

interface ApiEnvelope<T> {
  _data?: T[];
}

type ModelName = 'Dokumentas' | 'Suvestine';
type QueryParams = Record<string, string | undefined>;

export interface DocumentRecord {
  dokumento_id: string;
  pavadinimas: string;
  nuoroda: string;
  atv_dok_nr?: string | null;
  galioj_busena?: string | null;
  rusis?: string | null;
  priimtas?: string | null;
  isigalioja?: string | null;
  tekstas_lt?: string | null;
}

export interface EditionRecord {
  dokumento_id: string;
  suvestines_id: string;
  nuoroda: string;
  galioja_nuo: string;
  galioja_iki: string | null;
}

export interface EditionTextRecord extends EditionRecord {
  tekstas_lt: string | null;
}

async function sleep(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms));
}

async function rateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestAt;
  if (elapsed < MIN_DELAY_MS) {
    await sleep(MIN_DELAY_MS - elapsed);
  }
  lastRequestAt = Date.now();
}

function buildUrl(model: ModelName, params: QueryParams): string {
  const query = Object.entries(params)
    .map(([key, value]) =>
      value === undefined || value === ''
        ? encodeURIComponent(key)
        : `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join('&');
  return `${API_BASE}/${model}/:format/json?${query}`;
}

async function fetchJson<T>(url: string): Promise<T[]> {
  const maxRetries = 3;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    await rateLimit();

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
      redirect: 'follow',
    });

    if (response.ok) {
      const payload = await response.json() as ApiEnvelope<T>;
      return payload._data ?? [];
    }

    if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
      await sleep((attempt + 1) * 1500);
      continue;
    }

    throw new Error(`HTTP ${response.status} while fetching ${url}`);
  }

  throw new Error(`Failed to fetch ${url}`);
}

function quote(value: string): string {
  // API filter syntax expects single-quoted values.
  return `'${value.replace(/'/g, "''")}'`;
}

function makeOrExpression(field: string, values: string[]): string {
  if (values.length === 0) {
    throw new Error(`Cannot build OR expression for empty values list: ${field}`);
  }
  return values.map(value => `${field}=${quote(value)}`).join('|');
}

async function fetchAllRows<T>(
  model: ModelName,
  params: QueryParams,
  pageSize = 5000,
): Promise<T[]> {
  const out: T[] = [];
  let offset = 0;

  while (true) {
    const pageParams: QueryParams = {
      ...params,
      [`offset(${offset})`]: '',
      [`limit(${pageSize})`]: '',
    };
    const rows = await fetchJson<T>(buildUrl(model, pageParams));
    out.push(...rows);

    if (rows.length < pageSize) break;
    offset += pageSize;
    if (offset > 2_000_000) {
      throw new Error(`Pagination safety stop reached for ${model}`);
    }
  }

  return out;
}

export async function fetchDocumentRecord(documentId: string): Promise<DocumentRecord | null> {
  const url = buildUrl('Dokumentas', {
    'select(dokumento_id,pavadinimas,nuoroda,atv_dok_nr,galioj_busena,rusis,priimtas,isigalioja)': '',
    'dokumento_id': quote(documentId),
  });

  const rows = await fetchJson<DocumentRecord>(url);
  return rows[0] ?? null;
}

export async function fetchEditionRecords(documentId: string): Promise<EditionRecord[]> {
  const url = buildUrl('Suvestine', {
    'select(dokumento_id,suvestines_id,nuoroda,galioja_nuo,galioja_iki)': '',
    'dokumento_id': quote(documentId),
    'limit(5000)': '',
  });

  return fetchJson<EditionRecord>(url);
}

export async function fetchEditionText(documentId: string, editionId: string): Promise<EditionTextRecord | null> {
  const url = buildUrl('Suvestine', {
    'select(dokumento_id,suvestines_id,nuoroda,galioja_nuo,galioja_iki,tekstas_lt)': '',
    'dokumento_id': quote(documentId),
    'suvestines_id': quote(editionId),
  });

  const rows = await fetchJson<EditionTextRecord>(url);
  return rows[0] ?? null;
}

export function pickCurrentEdition(editions: EditionRecord[]): EditionRecord | null {
  if (editions.length === 0) return null;

  const current = editions.find(e => e.galioja_iki === null);
  if (current) return current;

  return [...editions].sort((a, b) => b.galioja_nuo.localeCompare(a.galioja_nuo))[0] ?? null;
}

export function sortEditionsNewestFirst(editions: EditionRecord[]): EditionRecord[] {
  return [...editions].sort((a, b) => b.galioja_nuo.localeCompare(a.galioja_nuo));
}

/**
 * Fetch all in-force Lithuanian laws (rusis=Įstatymas, galioj_busena=galioja).
 */
export async function fetchAllInForceLaws(): Promise<DocumentRecord[]> {
  return fetchAllRows<DocumentRecord>(
    'Dokumentas',
    {
      'select(dokumento_id,pavadinimas,nuoroda,atv_dok_nr,galioj_busena,rusis,priimtas,isigalioja)': '',
      'rusis': quote('Įstatymas'),
      'galioj_busena': quote('galioja'),
    },
    10000,
  );
}

export async function fetchDocumentTextsByIds(documentIds: string[]): Promise<DocumentRecord[]> {
  if (documentIds.length === 0) return [];

  const filterExpr = makeOrExpression('dokumento_id', documentIds);
  return fetchAllRows<DocumentRecord>(
    'Dokumentas',
    {
      'select(dokumento_id,pavadinimas,nuoroda,atv_dok_nr,galioj_busena,rusis,priimtas,isigalioja,tekstas_lt)': '',
      [filterExpr]: '',
    },
    5000,
  );
}

export async function fetchSuvestineMetadataByDocumentIds(documentIds: string[]): Promise<EditionRecord[]> {
  if (documentIds.length === 0) return [];

  const filterExpr = makeOrExpression('dokumento_id', documentIds);
  return fetchAllRows<EditionRecord>(
    'Suvestine',
    {
      'select(dokumento_id,suvestines_id,nuoroda,galioja_nuo,galioja_iki)': '',
      [filterExpr]: '',
    },
    10000,
  );
}

export async function fetchSuvestineTextsByIds(suvestineIds: string[]): Promise<EditionTextRecord[]> {
  if (suvestineIds.length === 0) return [];

  const filterExpr = makeOrExpression('suvestines_id', suvestineIds);
  return fetchAllRows<EditionTextRecord>(
    'Suvestine',
    {
      'select(dokumento_id,suvestines_id,nuoroda,galioja_nuo,galioja_iki,tekstas_lt)': '',
      [filterExpr]: '',
    },
    5000,
  );
}
