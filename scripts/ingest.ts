#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
  fetchDocumentRecord,
  fetchEditionRecords,
  fetchEditionText,
  pickCurrentEdition,
  sortEditionsNewestFirst,
  type DocumentRecord,
  type EditionRecord,
} from './lib/fetcher.js';
import { parseLithuanianLawText } from './lib/parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SEED_DIR = path.resolve(__dirname, '../data/seed');
const SOURCE_DIR = path.resolve(__dirname, '../data/source');

interface TargetLaw {
  file: string;
  id: string;
  shortName: string;
  titleEn: string;
  description: string;
  documentId: string;
  preferredEditionId?: string;
}

const TARGET_LAWS: TargetLaw[] = [
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
    // Latest two suvestine rows currently expose empty text via API; use latest non-empty edition.
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

function parseArgs(): { limit: number | null } {
  const args = process.argv.slice(2);
  let limit: number | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      const value = Number.parseInt(args[i + 1], 10);
      if (Number.isFinite(value) && value > 0) {
        limit = value;
      }
      i++;
    }
  }

  return { limit };
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

function clearSeedFiles(): void {
  const files = fs.readdirSync(SEED_DIR).filter(name => name.endsWith('.json'));
  for (const file of files) {
    fs.unlinkSync(path.join(SEED_DIR, file));
  }
}

async function resolveEditionWithText(
  documentId: string,
  editions: EditionRecord[],
  preferredEditionId?: string,
): Promise<{ edition: EditionRecord; text: string; sourceUrl: string }> {
  const tryEdition = async (edition: EditionRecord): Promise<{ edition: EditionRecord; text: string; sourceUrl: string } | null> => {
    const row = await fetchEditionText(documentId, edition.suvestines_id);
    const text = row?.tekstas_lt?.trim() ?? '';
    if (!text) return null;
    return {
      edition,
      text,
      sourceUrl: row?.nuoroda ?? edition.nuoroda,
    };
  };

  if (preferredEditionId) {
    const preferred = editions.find(e => e.suvestines_id === preferredEditionId);
    if (preferred) {
      const resolved = await tryEdition(preferred);
      if (resolved) return resolved;
    }
  }

  const current = pickCurrentEdition(editions);
  if (current) {
    const resolved = await tryEdition(current);
    if (resolved) return resolved;
  }

  for (const edition of sortEditionsNewestFirst(editions)) {
    const resolved = await tryEdition(edition);
    if (resolved) return resolved;
  }

  throw new Error(`No edition with non-empty text found for ${documentId}`);
}

function requireDocument(documentId: string, row: DocumentRecord | null): DocumentRecord {
  if (!row) {
    throw new Error(`Document ${documentId} was not found in official API`);
  }
  if ((row.rusis ?? '').toLowerCase() !== 'įstatymas') {
    throw new Error(`Document ${documentId} is not an įstatymas (rusis=${row.rusis ?? 'unknown'})`);
  }
  return row;
}

async function ingestOne(law: TargetLaw): Promise<{ provisions: number; definitions: number; editionId: string }> {
  const doc = requireDocument(law.documentId, await fetchDocumentRecord(law.documentId));
  const editions = await fetchEditionRecords(law.documentId);
  if (editions.length === 0) {
    throw new Error(`No suvestine editions found for ${law.documentId}`);
  }

  const resolved = await resolveEditionWithText(law.documentId, editions, law.preferredEditionId);
  const parsed = parseLithuanianLawText(resolved.text);

  if (parsed.provisions.length === 0) {
    throw new Error(`No provisions parsed for ${law.documentId}`);
  }

  const seed = {
    id: law.id,
    type: 'statute' as const,
    title: doc.pavadinimas,
    title_en: law.titleEn,
    short_name: law.shortName,
    status: mapStatus(doc.galioj_busena),
    issued_date: doc.priimtas ?? undefined,
    in_force_date: doc.isigalioja ?? undefined,
    url: resolved.sourceUrl,
    description: law.description,
    provisions: parsed.provisions,
    definitions: parsed.definitions,
  };

  const seedPath = path.join(SEED_DIR, law.file);
  fs.writeFileSync(seedPath, `${JSON.stringify(seed, null, 2)}\n`, 'utf8');

  const sourceMeta = {
    document_id: law.documentId,
    atv_dok_nr: doc.atv_dok_nr ?? null,
    title: doc.pavadinimas,
    selected_suvestines_id: resolved.edition.suvestines_id,
    selected_galioja_nuo: resolved.edition.galioja_nuo,
    selected_galioja_iki: resolved.edition.galioja_iki,
    source_url: resolved.sourceUrl,
    raw_text_length: resolved.text.length,
  };
  fs.writeFileSync(
    path.join(SOURCE_DIR, `${law.file.replace(/\.json$/, '')}.source.json`),
    `${JSON.stringify(sourceMeta, null, 2)}\n`,
    'utf8',
  );

  return {
    provisions: parsed.provisions.length,
    definitions: parsed.definitions.length,
    editionId: resolved.edition.suvestines_id,
  };
}

async function main(): Promise<void> {
  const { limit } = parseArgs();
  const laws = limit ? TARGET_LAWS.slice(0, limit) : TARGET_LAWS;

  console.log('Lithuanian Law MCP -- Real Data Ingestion');
  console.log('========================================');
  console.log('Source: TAR open data API (get.data.gov.lt / datasets/gov/lrsk/teises_aktai)');
  console.log(`Target laws: ${laws.length}\n`);

  ensureDirs();
  clearSeedFiles();

  let totalProvisions = 0;
  let totalDefinitions = 0;

  for (const law of laws) {
    process.stdout.write(`- ${law.file} (${law.documentId}) ... `);
    const result = await ingestOne(law);
    totalProvisions += result.provisions;
    totalDefinitions += result.definitions;
    console.log(`OK (${result.provisions} provisions, ${result.definitions} definitions, edition ${result.editionId})`);
  }

  console.log('\nIngestion complete.');
  console.log(`Seed files: ${laws.length}`);
  console.log(`Total provisions: ${totalProvisions}`);
  console.log(`Total definitions: ${totalDefinitions}`);
}

main().catch(error => {
  console.error('Fatal ingestion error:', error);
  process.exit(1);
});
