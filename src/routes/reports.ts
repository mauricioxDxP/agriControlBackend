// ============================================
// Routes: Reports
// PDF report generation
// ============================================

import { Router } from 'express';
import { reportController } from '../controllers/ReportController';

const router = Router();

router.get('/stock-verification', reportController.stockVerificationReport.bind(reportController));
router.get('/tancada/:id', reportController.tancadaResumenReport.bind(reportController));
router.get('/application/:id', reportController.applicationResumenReport.bind(reportController));

export default router;