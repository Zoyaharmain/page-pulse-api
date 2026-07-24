import request from 'supertest';
import app from '../src/app';
import { cacheService } from '../src/services/cache.service';

describe('PagePulse Audit API Suite', () => {
  afterAll(async () => {
    await cacheService.close();
  });

  describe('GET /api/v1/health', () => {
    it('should return 200 OK with health metadata', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('uptimeSeconds');
    });
  });

  describe('GET /api/v1/audit Input Validation', () => {
    it('should return 400 INVALID_INPUT for missing url query parameter', async () => {
      const res = await request(app).get('/api/v1/audit');
      expect(res.status).toBe(400);
      expect(res.body.error).toHaveProperty('code', 'INVALID_INPUT');
    });

    it('should return 400 INVALID_INPUT for invalid URL string', async () => {
      const res = await request(app).get('/api/v1/audit?url=not-a-url');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_INPUT');
    });
  });

  describe('GET /api/v1/audit Execution & Caching', () => {
    it('should audit a valid domain and cache subsequent request', async () => {
      const testUrl = 'https://example.com';

      // First Request (Cache Miss)
      const res1 = await request(app).get(`/api/v1/audit?url=${encodeURIComponent(testUrl)}`);
      expect(res1.status).toBe(200);
      expect(res1.body.status).toBe('success');
      expect(res1.body.data.url).toBe(testUrl);
      expect(res1.body.data.cached).toBe(false);
      expect(res1.body.data.performance).toHaveProperty('responseTimeMs');
      expect(res1.body.data.seo).toHaveProperty('title');
      expect(res1.body.data.security.isHttps).toBe(true);

      // Second Request (Cache Hit)
      const res2 = await request(app).get(`/api/v1/audit?url=${encodeURIComponent(testUrl)}`);
      expect(res2.status).toBe(200);
      expect(res2.body.data.cached).toBe(true);
    });

    it('should bypass cache when bypassCache=true is passed', async () => {
      const testUrl = 'https://example.com';
      const res = await request(app).get(`/api/v1/audit?url=${encodeURIComponent(testUrl)}&bypassCache=true`);
      expect(res.status).toBe(200);
      expect(res.body.data.cached).toBe(false);
    });
  });

  describe('Structured Error Handling & Middleware', () => {
    it('should attach X-Request-ID header to every response', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.headers).toHaveProperty('x-request-id');
    });
  });
});