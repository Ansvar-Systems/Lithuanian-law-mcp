import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from '@ansvar/mcp-sqlite';
import { searchLegislation } from '../../src/tools/search-legislation.js';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';
import * as os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_SRC = path.resolve(__dirname, '../../data/database.db');
const DB_AVAILABLE = fs.existsSync(DB_SRC);

describe.skipIf(!DB_AVAILABLE)('searchLegislation', () => {
  let db: InstanceType<typeof Database>;
  let tmpDir: string;
  let dbPath: string;

  beforeAll(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lt-law-test-'));
    dbPath = path.join(tmpDir, 'database.db');
    fs.copyFileSync(DB_SRC, dbPath);
    db = new Database(dbPath);
  });
  afterAll(() => {
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should find provisions matching "asmens duomenų"', async () => {
    const result = await searchLegislation(db, { query: 'asmens duomenų' });
    expect(result.results.length).toBeGreaterThan(0);
    const allText = result.results.map(r => r.snippet).join(' ').toLowerCase();
    expect(allText).toContain('duomen');
  });

  it('should find provisions matching "kibernetin"', async () => {
    const result = await searchLegislation(db, { query: 'kibernetin' });
    expect(result.results.length).toBeGreaterThan(0);
  });

  it('should find provisions matching "informacinių išteklių"', async () => {
    const result = await searchLegislation(db, { query: 'informacinių išteklių' });
    expect(result.results.length).toBeGreaterThan(0);
  });

  it('should find provisions matching "elektroninės atpažinties"', async () => {
    const result = await searchLegislation(db, { query: 'elektroninės atpažinties' });
    expect(result.results.length).toBeGreaterThan(0);
  });

  it('should find provisions matching "nacionaliniam saugumui"', async () => {
    const result = await searchLegislation(db, { query: 'nacionaliniam saugumui' });
    expect(result.results.length).toBeGreaterThan(0);
  });

  it('should return empty for gibberish query', async () => {
    const result = await searchLegislation(db, { query: 'xyzzy99plugh42' });
    expect(result.results).toHaveLength(0);
  });

  it('should return empty for empty query', async () => {
    const result = await searchLegislation(db, { query: '' });
    expect(result.results).toHaveLength(0);
  });

  it('should respect limit parameter', async () => {
    const result = await searchLegislation(db, { query: 'informacija', limit: 3 });
    expect(result.results.length).toBeLessThanOrEqual(3);
  });

  it('should filter by document_id', async () => {
    const result = await searchLegislation(db, {
      query: 'kibernetinio',
      document_id: 'lt-cybersec-xii1428',
    });
    expect(result.results.length).toBeGreaterThan(0);
    for (const r of result.results) {
      expect(r.document_id).toBe('lt-cybersec-xii1428');
    }
  });

  it('should include metadata', async () => {
    const result = await searchLegislation(db, { query: 'duomenų' });
    expect(result._metadata).toBeDefined();
    expect(result._metadata.jurisdiction).toBe('LT');
  });
});
