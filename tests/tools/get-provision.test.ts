import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from '@ansvar/mcp-sqlite';
import { getProvision } from '../../src/tools/get-provision.js';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';
import * as os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_SRC = path.resolve(__dirname, '../../data/database.db');
const DB_AVAILABLE = fs.existsSync(DB_SRC);

describe.skipIf(!DB_AVAILABLE)('getProvision', () => {
  let db: InstanceType<typeof Database>;
  let tmpDir: string;
  let dbPath: string;

  beforeAll(() => {
    // Copy DB to tmp so WASM can create lock files
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lt-law-test-'));
    dbPath = path.join(tmpDir, 'database.db');
    fs.copyFileSync(DB_SRC, dbPath);
    db = new Database(dbPath);
  });
  afterAll(() => {
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should return provision by direct document ID and provision_ref', async () => {
    const result = await getProvision(db, {
      document_id: 'lt-pdpa-i1374',
      provision_ref: '1',
    });
    expect(result.results).toHaveLength(1);
    expect(result.results[0].content.toLowerCase()).toContain('asmens duomen');
    expect(result.results[0].provision_ref).toBe('art1');
  });

  it('should resolve document by English title', async () => {
    const result = await getProvision(db, {
      document_id: 'Cybersecurity Law',
      provision_ref: '1',
    });
    expect(result.results).toHaveLength(1);
    expect(result.results[0].content.toLowerCase()).toContain('kibernetinio saugumo');
  });

  it('should resolve document by Lithuanian title substring', async () => {
    const result = await getProvision(db, {
      document_id: 'kibernetinio saugumo',
      provision_ref: '18',
    });
    expect(result.results).toHaveLength(1);
    expect(result.results[0].content.toLowerCase()).toContain('incident');
  });

  it('should return all provisions when no ref specified', async () => {
    const result = await getProvision(db, {
      document_id: 'lt-ns-ix1132',
    });
    expect(result.results.length).toBeGreaterThan(10);
  });

  it('should return empty for non-existent document', async () => {
    const result = await getProvision(db, {
      document_id: 'lt-nonexistent-9999',
      provision_ref: '1',
    });
    expect(result.results).toHaveLength(0);
  });

  it('should return empty for non-existent provision', async () => {
    const result = await getProvision(db, {
      document_id: 'lt-pdpa-i1374',
      provision_ref: '999ZZZ',
    });
    expect(result.results).toHaveLength(0);
  });

  it('should include metadata in response', async () => {
    const result = await getProvision(db, {
      document_id: 'lt-pdpa-i1374',
      provision_ref: '4',
    });
    expect(result._metadata).toBeDefined();
    expect(result._metadata.jurisdiction).toBe('LT');
    expect(result._metadata.data_source).toContain('e-tar.lt');
  });

  it('should retrieve Criminal Code cybercrime article', async () => {
    const result = await getProvision(db, {
      document_id: 'Criminal Code',
      provision_ref: '196',
    });
    expect(result.results).toHaveLength(1);
    expect(result.results[0].content.toLowerCase()).toContain('informacin');
    expect(result.results[0].content.toLowerCase()).toContain('neteisėtai');
  });
});
