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

/*
|--------------------------------------------------------------------------
| Root Route
|--------------------------------------------------------------------------
| This route displays a friendly message when someone opens
| your Render deployment URL in a browser.
|--------------------------------------------------------------------------
*/
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Page Pulse API is running successfully!',
    documentation: '/api/v1'
  });
});

// API Routes protected by Rate Limiter
app.use('/api/v1', apiRateLimiter, auditRoutes);

// Centralized Error Handling
app.use(errorHandler);

export default app;