import { Router } from 'express';
import { auditController } from '../controllers/audit.controller';

const router = Router();

router.get('/audit', auditController);

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

export default router;