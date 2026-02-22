import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from '@ansvar/mcp-sqlite';
import { getProvisionEUBasis } from '../../src/tools/get-provision-eu-basis.js';
import { getEUBasis } from '../../src/tools/get-eu-basis.js';
import { getLithuanianImplementations } from '../../src/tools/get-lithuanian-implementations.js';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';
import * as os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_SRC = path.resolve(__dirname, '../../data/database.db');
const DB_AVAILABLE = fs.existsSync(DB_SRC);

describe.skipIf(!DB_AVAILABLE)('EU reference tools', () => {
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

  describe('getProvisionEUBasis', () => {
    it('should find EU basis for GDPR implementing provision', async () => {
      const result = await getProvisionEUBasis(db, {
        document_id: 'lt-pdpa-i1374',
        provision_ref: 'art1',
      });
      expect(result.results).toBeDefined();
      const text = JSON.stringify(result.results);
      expect(text).toContain('2016/679');
    });

    it('should find EU basis for NIS2 implementing provision', async () => {
      const result = await getProvisionEUBasis(db, {
        document_id: 'lt-cybersec-xii1428',
        provision_ref: 'art38',
      });
      expect(result.results).toBeDefined();
      const text = JSON.stringify(result.results);
      expect(text).toContain('2022/2555');
    });
  });

  describe('getEUBasis', () => {
    it('should find EU basis for the data protection law', async () => {
      const result = await getEUBasis(db, {
        document_id: 'lt-pdpa-i1374',
      });
      expect(result.results).toBeDefined();
      const text = JSON.stringify(result.results);
      expect(text).toContain('2016/679');
    });
  });

  describe('getLithuanianImplementations', () => {
    it('should find GDPR implementations', async () => {
      const result = await getLithuanianImplementations(db, {
        eu_document_id: 'regulation:2016/679',
      });
      expect(result.results).toBeDefined();
      const text = JSON.stringify(result.results);
      expect(text).toContain('lt-pdpa-i1374');
    });
  });
});
