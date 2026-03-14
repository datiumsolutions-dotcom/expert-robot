import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { logger } from '@loyalty/utils';

const connection = new IORedis(process.env['REDIS_URL'] ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const importQueue = new Queue('import-orders', { connection });

export const importService = {
  async enqueueOrderImport(
    orgId: string,
    payload: Record<string, unknown>,
  ): Promise<{ jobId: string; status: string }> {
    const job = await importQueue.add('import-orders', { orgId, ...payload }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
    logger.info({ message: 'Import job enqueued', jobId: job.id, orgId });
    return { jobId: job.id ?? 'unknown', status: 'queued' };
  },

  async listJobs(orgId: string): Promise<{ jobId: string; status: string }[]> {
    // Placeholder — production would query a jobs table or BullMQ board
    logger.info({ message: 'listJobs called', orgId });
    return [];
  },

  async getJob(orgId: string, jobId: string): Promise<{ jobId: string; status: string } | null> {
    const job = await importQueue.getJob(jobId);
    if (!job) return null;
    const state = await job.getState();
    return { jobId, status: state };
  },
};
