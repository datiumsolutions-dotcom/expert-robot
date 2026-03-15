import type { Request, Response, NextFunction } from 'express';
import { importService } from './import.service';
import { successResponse } from '@loyalty/utils';

export const importController = {
  async importOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FILE',
            message: 'CSV file is required',
          },
        });
        return;
      }

      const report = await importService.processCSV(req.orgId!, req.file.buffer);
      res.status(200).json(successResponse(report));
    } catch (err) {
      next(err);
    }
  },
};
