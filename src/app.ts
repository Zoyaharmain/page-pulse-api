import express from 'express';
import cors from 'cors';
import path from 'path';
import auditRoutes from './routes/audit.routes';
import { requestIdMiddleware } from './middleware/requestId';
import { apiRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestIdMiddleware);

// Serve static frontend dashboard
app.use(express.static(path.join(__dirname, 'public')));

// API Routes protected by Rate Limiter
app.use('/api/v1', apiRateLimiter, auditRoutes);

// Centralized Error Handling
app.use(errorHandler);

export default app;