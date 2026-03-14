import { db } from '@loyalty/db';
import { processImport, ImportReport } from './import.processor';

export const importService = {
  async processCSV(orgId: string, csvBuffer: Buffer): Promise<ImportReport> {
    return processImport(db, orgId, csvBuffer);
  },
};
