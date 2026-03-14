// Express type augmentation for multi-tenancy context
import type { JwtPayload } from '@loyalty/types';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      orgId?: string;
      file?: {
        buffer: Buffer;
        originalname?: string;
        mimetype?: string;
        size?: number;
      };
    }
  }
}
