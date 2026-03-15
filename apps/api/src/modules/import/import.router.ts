import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import multer from 'multer';
import { importController } from './import.controller';

export const importRouter: ExpressRouter = Router();

const maxSizeMB = Number(process.env['UPLOAD_MAX_SIZE_MB'] ?? 10);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxSizeMB * 1024 * 1024 },
});

importRouter.post('/orders', upload.single('file'), importController.importOrders);
