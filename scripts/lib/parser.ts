/**
 * Parser for Lithuanian consolidated statute text (`tekstas_lt`).
 *
 * Source format is plain text from TAR open data with article headings such as:
 *   1 straipsnis. ...
 *   4-1 straipsnis. ...
 */

export interface ParsedProvision {
  provision_ref: string;
  chapter?: string;
  section: string;
  title: string;
  content: string;
}

export interface ParsedDefinition {
  term: string;
  definition: string;
  source_provision?: string;
}

export interface ParseResult {
  provisions: ParsedProvision[];
  definitions: ParsedDefinition[];
}

interface ArticleMarker {
  section: string;
  titleTail: string;
  index: number;
  matchLength: number;
}

interface ChapterMarker {
  index: number;
  label: string;
}

const ARTICLE_HEADING = /(^|\n)\s*(\d+[0-9A-Za-z-]*)\s+straipsnis\.\s*([^\n]*)/gim;
const FIRST_ARTICLE_HEADING = /^\s*\d+[0-9A-Za-z-]*\s+straipsnis\./im;

function normalizeInput(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/\u200b/g, '');
}

function trimTrailingSections(text: string): string {
  const changesIndex = text.search(/\nPakeitimai:\s*\n/i);
  if (changesIndex >= 0) {
    return text.slice(0, changesIndex);
  }
  return text;
}

function parseChapterMarkers(text: string): ChapterMarker[] {
  const lines = text.split('\n');
  const markers: ChapterMarker[] = [];
  let offset = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^[IVXLCDM]+\s+SKYRIUS$/i.test(line)) {
      let subtitle = '';
      for (let j = i + 1; j < Math.min(lines.length, i + 5); j++) {
        const candidate = lines[j].trim();
        if (!candidate) continue;
        if (/^\d+[0-9A-Za-z-]*\s+straipsnis\./i.test(candidate)) break;
        if (/^[IVXLCDM]+\s+SKYRIUS$/i.test(candidate)) break;
        subtitle = candidate;
        break;
      }
      markers.push({
        index: offset,
        label: subtitle ? `${line} ${subtitle}` : line,
      });
    }

    offset += lines[i].length + 1;
  }

  return markers;
}

function chapterForIndex(chapters: ChapterMarker[], index: number): string | undefined {
  let current: string | undefined;
  for (const chapter of chapters) {
    if (chapter.index > index) break;
    current = chapter.label;
  }
  return current;
}

function collectArticleMarkers(text: string): ArticleMarker[] {
  const markers: ArticleMarker[] = [];

  let match: RegExpExecArray | null;
  while ((match = ARTICLE_HEADING.exec(text)) !== null) {
    const section = match[2].trim();
    const titleTail = (match[3] ?? '').trim();
    markers.push({
      section,
      titleTail,
      index: match.index + (match[1] ? match[1].length : 0),
      matchLength: match[0].length - (match[1] ? match[1].length : 0),
    });
  }

  return markers;
}

function sanitizeSection(section: string): string {
  return section.replace(/\s+/g, '');
}

function makeProvisionRef(section: string): string {
  const normalized = section.toLowerCase().replace(/[^0-9a-z-]/g, '');
  return `art${normalized}`;
}

function cleanContent(raw: string): string {
  const lines = raw.split('\n');
  const out: string[] = [];
  let prevBlank = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (!prevBlank) {
        out.push('');
      }
      prevBlank = true;
      continue;
    }
    out.push(trimmed);
    prevBlank = false;
  }

  return out.join('\n').trim();
}

function maybePromoteFirstLineAsTitle(titleTail: string, content: string): { titleTail: string; content: string } {
  if (titleTail) return { titleTail, content };

  const lines = content.split('\n');
  const first = lines[0]?.trim() ?? '';
  if (!first) return { titleTail, content };

  // Promotion heuristic: short, non-numbered heading-like line.
  if (first.length > 180) return { titleTail, content };
  if (/^\d+[.)]/.test(first)) return { titleTail, content };
  if (/^(SKIRSNIS|SKYRIUS|POSKYRIS)$/i.test(first)) return { titleTail, content };

  const remaining = lines.slice(1).join('\n').trim();
  return {
    titleTail: first,
    content: remaining,
  };
}

function extractDefinitionsFromProvision(content: string, provisionRef: string): ParsedDefinition[] {
  const definitions: ParsedDefinition[] = [];

  // Numbered definition pattern: "1. Sąvoka – apibrėžtis"
  const numberedPattern = /(?:^|\n)\s*\d+\.\s*([^\n–—-]{2,140}?)\s*[–—-]\s*([^\n].+?)(?=(?:\n\s*\d+\.\s*[^\n–—-]{2,140}?\s*[–—-])|$)/gs;
  let match: RegExpExecArray | null;
  while ((match = numberedPattern.exec(content)) !== null) {
    const term = match[1].trim();
    const definition = match[2].trim();
    if (term.length >= 2 && definition.length >= 5) {
      definitions.push({ term, definition, source_provision: provisionRef });
    }
  }

  // Quoted term pattern: „Sąvoka“ – apibrėžtis
  const quotedPattern = /„([^“]{2,140})“\s*[–—-]\s*([^\n]{5,500})/g;
  while ((match = quotedPattern.exec(content)) !== null) {
    const term = match[1].trim();
    const definition = match[2].trim();
    if (term.length >= 2 && definition.length >= 5) {
      definitions.push({ term, definition, source_provision: provisionRef });
    }
  }

  // Deduplicate by lowercase term and exact definition.
  const seen = new Set<string>();
  const deduped: ParsedDefinition[] = [];
  for (const def of definitions) {
    const key = `${def.term.toLowerCase()}|${def.definition}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(def);
  }

  return deduped;
}

export function parseLithuanianLawText(text: string): ParseResult {
  const normalized = trimTrailingSections(normalizeInput(text));
  const firstArticle = normalized.search(FIRST_ARTICLE_HEADING);
  if (firstArticle < 0) {
    return { provisions: [], definitions: [] };
  }

  const relevant = normalized.slice(firstArticle);
  const chapters = parseChapterMarkers(relevant);
  const markers = collectArticleMarkers(relevant);

  const provisions: ParsedProvision[] = [];
  const definitions: ParsedDefinition[] = [];

  for (let i = 0; i < markers.length; i++) {
    const current = markers[i];
    const next = markers[i + 1];

    const start = current.index + current.matchLength;
    const end = next ? next.index : relevant.length;
    const section = sanitizeSection(current.section);

    let content = cleanContent(relevant.slice(start, end));
    let titleTail = current.titleTail;

    const promoted = maybePromoteFirstLineAsTitle(titleTail, content);
    titleTail = promoted.titleTail;
    content = promoted.content;

    if (!content) continue;

    const title = titleTail
      ? `${section} straipsnis. ${titleTail}`
      : `${section} straipsnis`;
    const provisionRef = makeProvisionRef(section);

    provisions.push({
      provision_ref: provisionRef,
      chapter: chapterForIndex(chapters, current.index),
      section,
      title,
      content,
    });

    if (/sąvok|apibrėž|šiame įstatyme vartojam/i.test(`${title}\n${content}`)) {
      definitions.push(...extractDefinitionsFromProvision(content, provisionRef));
    }
  }

  return {
    provisions,
    definitions: definitions.slice(0, 200),
  };
}
