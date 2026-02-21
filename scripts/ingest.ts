#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
  fetchAllInForceLaws,
  fetchDocumentTextsByIds,
  fetchSuvestineMetadataByDocumentIds,
  fetchSuvestineTextsByIds,
  sortEditionsNewestFirst,
  type DocumentRecord,
  type EditionRecord,
  type EditionTextRecord,
} from './lib/fetcher.js';
import { parseLithuanianLawText } from './lib/parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEED_DIR = path.resolve(__dirname, '../data/seed');
const SOURCE_DIR = path.resolve(__dirname, '../data/source');

interface KnownLawOverride {
  documentId: string;
  id: string;
  file: string;
  shortName: string;
  titleEn: string;
  description: string;
  preferredEditionId?: string;
}

const KNOWN_LAWS: KnownLawOverride[] = [
  {
    file: '01-personal-data-protection.json',
    id: 'lt-pdpa-i1374',
    shortName: 'ADTAĮ',
    titleEn: 'Law on Legal Protection of Personal Data',
    description:
      'Lithuanian framework law on personal data protection and data-subject rights in national legal context.',
    documentId: 'TAR.5368B592234C',
    preferredEditionId: 'yKQDfQUMHT',
  },
  {
    file: '02-cyber-security.json',
    id: 'lt-cybersec-xii1428',
    shortName: 'Kibernetinio saugumo įstatymas',
    titleEn: 'Cybersecurity Law',
    description:
      'Sets Lithuania’s national cybersecurity framework, including institutional roles, obligations, and incident handling duties.',
    documentId: '5468a25089ef11e4a98a9f2247652cf4',
    preferredEditionId: 'bjhGPyIkxw',
  },
  {
    file: '03-electronic-communications.json',
    id: 'lt-ecomm-ix2135',
    shortName: 'ERĮ',
    titleEn: 'Law on Electronic Communications',
    description:
      'Regulates electronic communications networks and services, including operator obligations and user protections.',
    documentId: 'TAR.82D8168D3049',
    preferredEditionId: 'nnraxghcVJ',
  },
  {
    file: '04-information-society-services.json',
    id: 'lt-iss-x614',
    shortName: 'IVPĮ',
    titleEn: 'Law on Information Society Services',
    description:
      'Defines legal requirements for information society services and intermediary service provider responsibilities.',
    documentId: 'TAR.8A719A97956F',
    preferredEditionId: 'eszgoxyWad',
  },
  {
    file: '05-right-to-information.json',
    id: 'lt-rti-viii1524',
    shortName: 'TGIDPNĮ',
    titleEn: 'Law on the Right to Obtain Information and Re-use Data',
    description:
      'Governs access to information held by public bodies and the re-use of public sector data.',
    documentId: 'TAR.FA13E28615F6',
    preferredEditionId: 'HIgGrRVEfx',
  },
  {
    file: '06-electronic-identification.json',
    id: 'lt-eidas-xiii1120',
    shortName: 'eIDAS įstatymas',
    titleEn: 'Law on Electronic Identification and Trust Services for Electronic Transactions',
    description:
      'Provides national rules for electronic identification and trust services in electronic transactions.',
    documentId: '88ad61b052c111e884cbc4327e55f3ca',
    preferredEditionId: 'QQZOtRRnEm',
  },
  {
    file: '07-state-information-resources.json',
    id: 'lt-sir-xi1807',
    shortName: 'VIIVĮ',
    titleEn: 'Law on the Management of State Information Resources',
    description:
      'Establishes governance and management requirements for state information resources and information systems.',
    documentId: 'TAR.85C510BA700A',
    preferredEditionId: 'bhspVpLFPO',
  },
  {
    file: '08-criminal-code.json',
    id: 'lt-cc-viii1968',
    shortName: 'BK',
    titleEn: 'Criminal Code',
    description:
      'Contains criminal law provisions, including offenses relevant to information systems, data, and cybersecurity.',
    documentId: 'TAR.2B866DFF7D43',
    preferredEditionId: 'kdXNfHZbYx',
  },
  {
    file: '09-health-data-reuse.json',
    id: 'lt-health-data-xiv789',
    shortName: 'PSDNĮ',
    titleEn: 'Law on Re-use of Health Data',
    description:
      'Regulates secondary use of health data, including access conditions, governance, and safeguards.',
    documentId: '0457ba8067e611eca9ac839120d251c4',
    preferredEditionId: 'zjELZwRAeE',
  },
  {
    file: '10-national-security-objects.json',
    id: 'lt-ns-ix1132',
    shortName: 'NSUĮ',
    titleEn: 'Law on Protection of Objects Important for Ensuring National Security',
    description:
      'Sets legal protections and control mechanisms for facilities and assets important to national security.',
    documentId: 'TAR.57E0E8B29108',
    preferredEditionId: 'IDenoFjHHS',
  },
];

const KNOWN_BY_DOCUMENT = new Map(KNOWN_LAWS.map(item => [item.documentId, item]));

type SourceModel = 'Suvestine' | 'Dokumentas';

interface SelectedSource {
  sourceModel: SourceModel;
  sourceUrl: string;
  text: string;
  edition?: EditionRecord;
}

interface SkippedLaw {
  document_id: string;
  title: string;
  reason: string;
  details?: string;
}

interface CliArgs {
  mode: 'full' | 'sample';
  limit: number | null;
  start: number;
  resume: boolean;
  chunkDocs: number;
  chunkTexts: number;
  maxSuvestineRounds: number;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const parsed: CliArgs = {
    mode: 'full',
    limit: null,
    start: 0,
    resume: false,
    chunkDocs: 100,
    chunkTexts: 40,
    maxSuvestineRounds: 20,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    if (arg === '--sample') {
      parsed.mode = 'sample';
      continue;
    }
    if (arg === '--full') {
      parsed.mode = 'full';
      continue;
    }
    if (arg === '--resume') {
      parsed.resume = true;
      continue;
    }

    if (arg === '--start' && next) {
      const value = Number.parseInt(next, 10);
      if (Number.isFinite(value) && value >= 0) parsed.start = value;
      i++;
      continue;
    }

    if (arg === '--limit' && next) {
      const value = Number.parseInt(next, 10);
      if (Number.isFinite(value) && value > 0) parsed.limit = value;
      i++;
      continue;
    }

    if (arg === '--chunk-docs' && next) {
      const value = Number.parseInt(next, 10);
      if (Number.isFinite(value) && value > 0) parsed.chunkDocs = value;
      i++;
      continue;
    }

    if (arg === '--chunk-texts' && next) {
      const value = Number.parseInt(next, 10);
      if (Number.isFinite(value) && value > 0) parsed.chunkTexts = value;
      i++;
      continue;
    }

    if (arg === '--max-suvestine-rounds' && next) {
      const value = Number.parseInt(next, 10);
      if (Number.isFinite(value) && value > 0) parsed.maxSuvestineRounds = value;
      i++;
      continue;
    }
  }

  return parsed;
}

function mapStatus(value: string | null | undefined): 'in_force' | 'amended' | 'repealed' | 'not_yet_in_force' {
  const normalized = (value ?? '').trim().toLowerCase();
  if (normalized === 'galioja') return 'in_force';
  if (normalized === 'negalioja') return 'repealed';
  return 'in_force';
}

function ensureDirs(): void {
  fs.mkdirSync(SEED_DIR, { recursive: true });
  fs.mkdirSync(SOURCE_DIR, { recursive: true });
}

function clearJsonFiles(dir: string): void {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.json')) continue;
    fs.unlinkSync(path.join(dir, name));
  }
}

function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

function slugify(input: string): string {
  const normalized = input
    .toLowerCase()
    .replace(/ą/g, 'a')
    .replace(/č/g, 'c')
    .replace(/ę/g, 'e')
    .replace(/ė/g, 'e')
    .replace(/į/g, 'i')
    .replace(/š/g, 's')
    .replace(/ų/g, 'u')
    .replace(/ū/g, 'u')
    .replace(/ž/g, 'z');

  return normalized
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .replace(/-{2,}/g, '-');
}

function buildAutoId(doc: DocumentRecord, usedIds: Set<string>): string {
  const raw = doc.atv_dok_nr?.trim() || doc.dokumento_id;
  let base = `lt-law-${slugify(raw) || slugify(doc.dokumento_id) || 'unknown'}`;
  if (base.length > 72) {
    base = base.slice(0, 72).replace(/-+$/, '');
  }

  const suffix = slugify(doc.dokumento_id).slice(0, 10) || 'id';
  let candidate = base;

  if (usedIds.has(candidate)) {
    candidate = `${base}-${suffix}`;
  }

  let i = 2;
  while (usedIds.has(candidate)) {
    candidate = `${base}-${suffix}-${i}`;
    i++;
  }

  usedIds.add(candidate);
  return candidate;
}

function buildSeedIdMap(docs: DocumentRecord[]): Map<string, string> {
  const map = new Map<string, string>();
  const used = new Set<string>();

  for (const doc of docs) {
    const known = KNOWN_BY_DOCUMENT.get(doc.dokumento_id);
    if (known) {
      if (used.has(known.id)) {
        throw new Error(`Duplicate known id detected: ${known.id}`);
      }
      used.add(known.id);
      map.set(doc.dokumento_id, known.id);
      continue;
    }

    map.set(doc.dokumento_id, buildAutoId(doc, used));
  }

  return map;
}

async function collectSuvestineMetadata(
  docs: DocumentRecord[],
  chunkDocs: number,
): Promise<Map<string, EditionRecord[]>> {
  const byDoc = new Map<string, EditionRecord[]>();
  const ids = docs.map(doc => doc.dokumento_id);
  const chunks = chunkArray(ids, chunkDocs);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    process.stdout.write(`  [suvestine-meta ${i + 1}/${chunks.length}] documents=${chunk.length} ... `);
    const rows = await fetchSuvestineMetadataByDocumentIds(chunk);
    console.log(`rows=${rows.length}`);

    for (const row of rows) {
      const list = byDoc.get(row.dokumento_id) ?? [];
      list.push(row);
      byDoc.set(row.dokumento_id, list);
    }
  }

  for (const doc of docs) {
    const list = byDoc.get(doc.dokumento_id) ?? [];
    const dedupe = new Map<string, EditionRecord>();
    for (const item of list) {
      const key = item.suvestines_id;
      const existing = dedupe.get(key);
      if (!existing || item.galioja_nuo > existing.galioja_nuo) {
        dedupe.set(key, item);
      }
    }

    const sorted = sortEditionsNewestFirst(Array.from(dedupe.values()));
    const known = KNOWN_BY_DOCUMENT.get(doc.dokumento_id);
    if (known?.preferredEditionId) {
      const idx = sorted.findIndex(item => item.suvestines_id === known.preferredEditionId);
      if (idx > 0) {
        const [preferred] = sorted.splice(idx, 1);
        sorted.unshift(preferred);
      }
    }

    byDoc.set(doc.dokumento_id, sorted);
  }

  return byDoc;
}

async function resolveSuvestineSources(
  docs: DocumentRecord[],
  editionsByDoc: Map<string, EditionRecord[]>,
  chunkTexts: number,
  maxRounds: number,
): Promise<{ selected: Map<string, SelectedSource>; unresolved: string[] }> {
  const selected = new Map<string, SelectedSource>();
  const initiallyResolvable = docs
    .map(doc => doc.dokumento_id)
    .filter(docId => (editionsByDoc.get(docId)?.length ?? 0) > 0);

  let unresolved = initiallyResolvable;
  let round = 0;

  while (unresolved.length > 0 && round < maxRounds) {
    const candidates = new Map<string, EditionRecord>();
    const roundExhausted: string[] = [];

    for (const docId of unresolved) {
      const list = editionsByDoc.get(docId) ?? [];
      const candidate = list[round];
      if (candidate) {
        candidates.set(docId, candidate);
      } else {
        roundExhausted.push(docId);
      }
    }

    if (candidates.size === 0) break;

    const suvestineIds = Array.from(new Set(Array.from(candidates.values()).map(item => item.suvestines_id)));
    console.log(
      `  [suvestine-text round ${round + 1}] unresolved=${unresolved.length}, candidates=${candidates.size}, suvestines=${suvestineIds.length}`,
    );

    const textBySuvestine = new Map<string, EditionTextRecord>();
    const textChunks = chunkArray(suvestineIds, chunkTexts);
    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i];
      const rows = await fetchSuvestineTextsByIds(chunk);
      for (const row of rows) {
        textBySuvestine.set(row.suvestines_id, row);
      }
      if ((i + 1) % 25 === 0 || i + 1 === textChunks.length) {
        console.log(`    text chunks fetched: ${i + 1}/${textChunks.length}`);
      }
    }

    const nextUnresolved: string[] = [];

    for (const [docId, edition] of candidates) {
      const row = textBySuvestine.get(edition.suvestines_id);
      const text = row?.tekstas_lt?.trim() ?? '';

      if (text.length > 0) {
        selected.set(docId, {
          sourceModel: 'Suvestine',
          sourceUrl: row?.nuoroda ?? edition.nuoroda,
          text,
          edition,
        });
        continue;
      }

      const list = editionsByDoc.get(docId) ?? [];
      const hasMore = list.length > round + 1;
      if (hasMore) {
        nextUnresolved.push(docId);
      }
    }

    for (const docId of roundExhausted) {
      const list = editionsByDoc.get(docId) ?? [];
      const hasMore = list.length > round + 1;
      if (hasMore) {
        nextUnresolved.push(docId);
      }
    }

    unresolved = nextUnresolved;
    round++;
  }

  const unresolvedAfterRounds = docs
    .map(doc => doc.dokumento_id)
    .filter(docId => !selected.has(docId));

  return {
    selected,
    unresolved: unresolvedAfterRounds,
  };
}

async function resolveDocumentFallbackSources(
  unresolvedDocIds: string[],
  chunkDocs: number,
): Promise<Map<string, SelectedSource>> {
  const selected = new Map<string, SelectedSource>();
  const chunks = chunkArray(unresolvedDocIds, chunkDocs);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    process.stdout.write(`  [document-fallback ${i + 1}/${chunks.length}] documents=${chunk.length} ... `);
    const rows = await fetchDocumentTextsByIds(chunk);
    console.log(`rows=${rows.length}`);

    for (const row of rows) {
      const text = row.tekstas_lt?.trim() ?? '';
      if (!text) continue;
      selected.set(row.dokumento_id, {
        sourceModel: 'Dokumentas',
        sourceUrl: row.nuoroda,
        text,
      });
    }
  }

  return selected;
}

function writeJson(filePath: string, value: unknown): void {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function main(): Promise<void> {
  const args = parseArgs();

  console.log('Lithuanian Law MCP -- Real Data Ingestion');
  console.log('========================================');
  console.log('Source: TAR open data API (get.data.gov.lt / datasets/gov/lrsk/teises_aktai)');
  console.log(`Mode: ${args.mode}`);
  console.log(`Start offset: ${args.start}`);
  console.log(`Resume mode: ${args.resume}`);
  console.log(`Chunk sizes: docs=${args.chunkDocs}, texts=${args.chunkTexts}`);
  console.log(`Max suvestine fallback rounds: ${args.maxSuvestineRounds}\n`);

  ensureDirs();
  if (!args.resume) {
    clearJsonFiles(SEED_DIR);
    clearJsonFiles(SOURCE_DIR);
  }

  const allInForceLaws = await fetchAllInForceLaws();
  allInForceLaws.sort((a, b) => a.dokumento_id.localeCompare(b.dokumento_id));

  let corpusDocs: DocumentRecord[];
  if (args.mode === 'sample') {
    const wantedIds = new Set(KNOWN_LAWS.map(item => item.documentId));
    corpusDocs = allInForceLaws.filter(doc => wantedIds.has(doc.dokumento_id));
    corpusDocs.sort((a, b) => {
      const ai = KNOWN_LAWS.findIndex(item => item.documentId === a.dokumento_id);
      const bi = KNOWN_LAWS.findIndex(item => item.documentId === b.dokumento_id);
      return ai - bi;
    });
  } else {
    corpusDocs = allInForceLaws;
  }

  let targetDocs: DocumentRecord[];
  if (args.limit) {
    targetDocs = corpusDocs.slice(args.start, args.start + args.limit);
  } else {
    targetDocs = corpusDocs.slice(args.start);
  }

  if (args.limit) {
    // already applied together with start
  }

  console.log(`In-force laws discovered: ${allInForceLaws.length}`);
  console.log(`Corpus laws selected by mode: ${corpusDocs.length}`);
  console.log(`Target laws selected: ${targetDocs.length}\n`);

  const seedIdByDocument = buildSeedIdMap(corpusDocs);
  const globalIndexByDocument = new Map(corpusDocs.map((doc, idx) => [doc.dokumento_id, idx]));

  console.log('Collecting consolidated edition metadata...');
  const editionsByDoc = await collectSuvestineMetadata(targetDocs, args.chunkDocs);

  const docsWithSuvestine = targetDocs.filter(doc => (editionsByDoc.get(doc.dokumento_id)?.length ?? 0) > 0).length;
  console.log(`Suvestine coverage: ${docsWithSuvestine}/${targetDocs.length} docs have at least one edition\n`);

  console.log('Resolving consolidated text editions...');
  const suvestineResolution = await resolveSuvestineSources(
    targetDocs,
    editionsByDoc,
    args.chunkTexts,
    args.maxSuvestineRounds,
  );

  console.log(`Suvestine text resolved: ${suvestineResolution.selected.size}/${targetDocs.length}`);
  console.log(`Needs Dokumentas fallback: ${suvestineResolution.unresolved.length}\n`);

  console.log('Resolving fallback text from Dokumentas...');
  const fallbackSelected = await resolveDocumentFallbackSources(suvestineResolution.unresolved, args.chunkDocs);
  console.log(`Dokumentas fallback resolved: ${fallbackSelected.size}/${suvestineResolution.unresolved.length}\n`);

  const selectedByDocument = new Map<string, SelectedSource>();
  for (const [docId, source] of suvestineResolution.selected) {
    selectedByDocument.set(docId, source);
  }
  for (const [docId, source] of fallbackSelected) {
    if (!selectedByDocument.has(docId)) {
      selectedByDocument.set(docId, source);
    }
  }

  const skipped: SkippedLaw[] = [];
  let written = 0;
  let totalProvisions = 0;
  let totalDefinitions = 0;
  let suvestineUsed = 0;
  let dokumentasUsed = 0;

  const width = Math.max(5, String(corpusDocs.length).length);

  console.log('Parsing and writing seed files...');
  for (const doc of targetDocs) {
    const source = selectedByDocument.get(doc.dokumento_id);
    if (!source) {
      skipped.push({
        document_id: doc.dokumento_id,
        title: doc.pavadinimas,
        reason: 'no_text_available',
        details: 'No non-empty text from Suvestine rounds or Dokumentas fallback',
      });
      continue;
    }

    const parsed = parseLithuanianLawText(source.text);
    if (parsed.provisions.length === 0) {
      skipped.push({
        document_id: doc.dokumento_id,
        title: doc.pavadinimas,
        reason: 'no_parsed_provisions',
        details: `Source model=${source.sourceModel}, text_length=${source.text.length}`,
      });
      continue;
    }

    const known = KNOWN_BY_DOCUMENT.get(doc.dokumento_id);
    const seedId = seedIdByDocument.get(doc.dokumento_id);
    if (!seedId) {
      throw new Error(`Missing seed id for ${doc.dokumento_id}`);
    }

    const fileName =
      args.mode === 'sample' && known?.file && args.start === 0
        ? known.file
        : (() => {
            const globalIndex = globalIndexByDocument.get(doc.dokumento_id);
            if (globalIndex === undefined) {
              throw new Error(`Missing global index for ${doc.dokumento_id}`);
            }
            return `${String(globalIndex + 1).padStart(width, '0')}-${seedId}.json`;
          })();

    const seed = {
      id: seedId,
      type: 'statute' as const,
      title: doc.pavadinimas,
      title_en: known?.titleEn ?? undefined,
      short_name: known?.shortName ?? doc.atv_dok_nr ?? undefined,
      status: mapStatus(doc.galioj_busena),
      issued_date: doc.priimtas ?? undefined,
      in_force_date: doc.isigalioja ?? undefined,
      url: source.sourceUrl || doc.nuoroda,
      description: known?.description ?? undefined,
      provisions: parsed.provisions,
      definitions: parsed.definitions,
    };

    writeJson(path.join(SEED_DIR, fileName), seed);

    const sourceMeta = {
      document_id: doc.dokumento_id,
      atv_dok_nr: doc.atv_dok_nr ?? null,
      title: doc.pavadinimas,
      selected_suvestines_id: source.edition?.suvestines_id ?? null,
      selected_galioja_nuo: source.edition?.galioja_nuo ?? null,
      selected_galioja_iki: source.edition?.galioja_iki ?? null,
      source_model: source.sourceModel,
      source_url: source.sourceUrl || doc.nuoroda,
      raw_text_length: source.text.length,
      parsed_provisions: parsed.provisions.length,
      parsed_definitions: parsed.definitions.length,
    };

    writeJson(path.join(SOURCE_DIR, `${fileName.replace(/\.json$/, '')}.source.json`), sourceMeta);

    totalProvisions += parsed.provisions.length;
    totalDefinitions += parsed.definitions.length;
    written++;
    if (source.sourceModel === 'Suvestine') suvestineUsed++;
    if (source.sourceModel === 'Dokumentas') dokumentasUsed++;

    if (written % 250 === 0) {
      console.log(`  progress: ${written} written`);
    }
  }

  const summaryPath = path.join(SOURCE_DIR, '_ingestion-summary.json');
  const skippedPath = path.join(SOURCE_DIR, '_skipped-laws.json');
  const previousSummary = args.resume && fs.existsSync(summaryPath)
    ? JSON.parse(fs.readFileSync(summaryPath, 'utf8')) as Record<string, unknown>
    : null;
  const previousSkipped = args.resume && fs.existsSync(skippedPath)
    ? JSON.parse(fs.readFileSync(skippedPath, 'utf8')) as SkippedLaw[]
    : [];

  const mergedSkippedMap = new Map<string, SkippedLaw>();
  for (const item of previousSkipped) {
    mergedSkippedMap.set(`${item.document_id}:${item.reason}`, item);
  }
  for (const item of skipped) {
    mergedSkippedMap.set(`${item.document_id}:${item.reason}`, item);
  }
  const mergedSkipped = Array.from(mergedSkippedMap.values()).sort((a, b) => a.document_id.localeCompare(b.document_id));

  const summary = {
    mode: args.mode,
    run_at: new Date().toISOString(),
    target_laws: corpusDocs.length,
    processed_window: {
      start: args.start,
      count: targetDocs.length,
      end_exclusive: args.start + targetDocs.length,
    },
    written_seed_files: fs.readdirSync(SEED_DIR).filter(name => name.endsWith('.json')).length,
    skipped_laws: mergedSkipped.length,
    source_usage: {
      suvestine: (Number(previousSummary?.source_usage && (previousSummary.source_usage as { suvestine?: number }).suvestine) || 0) + suvestineUsed,
      dokumentas_fallback:
        (Number(previousSummary?.source_usage && (previousSummary.source_usage as { dokumentas_fallback?: number }).dokumentas_fallback) || 0) +
        dokumentasUsed,
    },
    totals: {
      provisions: (Number(previousSummary?.totals && (previousSummary.totals as { provisions?: number }).provisions) || 0) + totalProvisions,
      definitions: (Number(previousSummary?.totals && (previousSummary.totals as { definitions?: number }).definitions) || 0) + totalDefinitions,
    },
  };

  writeJson(summaryPath, summary);
  writeJson(skippedPath, mergedSkipped);

  console.log('\nIngestion complete.');
  console.log(`Seed files written: ${written}`);
  console.log(`Skipped laws (batch): ${skipped.length}`);
  console.log(`Skipped laws (merged): ${mergedSkipped.length}`);
  console.log(`Total provisions: ${totalProvisions}`);
  console.log(`Total definitions: ${totalDefinitions}`);
  console.log(`Source usage: Suvestine=${suvestineUsed}, Dokumentas fallback=${dokumentasUsed}`);
}

main().catch(error => {
  console.error('Fatal ingestion error:', error);
  process.exit(1);
});
