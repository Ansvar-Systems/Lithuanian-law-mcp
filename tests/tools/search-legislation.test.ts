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

describe('searchLegislation', () => {
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

  it('should find provisions matching "personal data"', async () => {
    const result = await searchLegislation(db, { query: 'personal data' });
    expect(result.results.length).toBeGreaterThan(0);
    const allText = result.results.map(r => r.snippet).join(' ').toLowerCase();
    expect(allText).toContain('personal');
  });

  it('should find provisions matching "cyber incident"', async () => {
    const result = await searchLegislation(db, { query: 'cyber incident' });
    expect(result.results.length).toBeGreaterThan(0);
  });

  it('should find provisions matching "critical infrastructure"', async () => {
    const result = await searchLegislation(db, { query: 'critical infrastructure' });
    expect(result.results.length).toBeGreaterThan(0);
  });

  it('should find provisions matching "electronic signature"', async () => {
    const result = await searchLegislation(db, { query: 'electronic signature' });
    expect(result.results.length).toBeGreaterThan(0);
  });

  it('should find provisions matching "trade secret"', async () => {
    const result = await searchLegislation(db, { query: 'trade secret' });
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
    const result = await searchLegislation(db, { query: 'information', limit: 3 });
    expect(result.results.length).toBeLessThanOrEqual(3);
  });

  it('should filter by document_id', async () => {
    const result = await searchLegislation(db, {
      query: 'security',
      document_id: 'lt-cybersec-2018',
    });
    expect(result.results.length).toBeGreaterThan(0);
    for (const r of result.results) {
      expect(r.document_id).toBe('lt-cybersec-2018');
    }
  });

  it('should include metadata', async () => {
    const result = await searchLegislation(db, { query: 'data' });
    expect(result._metadata).toBeDefined();
    expect(result._metadata.jurisdiction).toBe('LT');
  });
});
