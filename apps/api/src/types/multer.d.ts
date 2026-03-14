declare module 'multer' {
  import type { RequestHandler } from 'express';

  interface MulterInstance {
    single(fieldName: string): RequestHandler;
  }

  interface MulterOptions {
    storage?: unknown;
    limits?: { fileSize?: number };
  }

  interface MulterStatic {
    (options?: MulterOptions): MulterInstance;
    memoryStorage(): unknown;
  }

  const multer: MulterStatic;
  export default multer;
}
