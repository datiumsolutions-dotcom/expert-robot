jest.mock('@loyalty/db/src/client', () => ({ prisma: {} }));

jest.mock('multer', () => {
  const m = () => ({ single: () => (_req: unknown, _res: unknown, next: (err?: unknown) => void) => next() });
  (m as unknown as { memoryStorage: () => Record<string, never> }).memoryStorage = () => ({});
  return m;
}, { virtual: true });

import request from 'supertest';
import { createApp } from '../app';

const app = createApp();

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});

describe('GET /api/v1/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
