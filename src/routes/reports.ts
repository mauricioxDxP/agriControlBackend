// ============================================
// Routes: Reports
// PDF report generation
// ============================================

import { Router } from 'express';
import { reportController } from '../controllers/ReportController';

const router = Router();

router.get('/stock-verification', reportController.stockVerificationReport.bind(reportController));

export default router;