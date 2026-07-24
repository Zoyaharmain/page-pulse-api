import axios from 'axios';
import * as cheerio from 'cheerio';
import pLimit from 'p-limit';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';

export interface AuditResult {
  url: string;
  auditTimestamp: string;
  performance: {
    responseTimeMs: number;
    statusCode: number;
    contentLengthBytes: number;
  };
  seo: {
    title: string | null;
    metaDescription: string | null;
    h1Count: number;
    canonicalUrl: string | null;
    openGraphTitle: string | null;
    openGraphImage: string | null;
  };
  security: {
    isHttps: boolean;
    hasStrictTransportSecurity: boolean;
    hasContentSecurityPolicy: boolean;
  };
  cached: boolean;
}

class AuditService {
  private limit = pLimit(env.MAX_CONCURRENT_AUDITS);

  async performAudit(targetUrl: string): Promise<Omit<AuditResult, 'cached'>> {
    return this.limit(async () => {
      const startTime = Date.now();
      try {
        const response = await axios.get(targetUrl, {
          timeout: env.AUDIT_TIMEOUT_MS,
          headers: {
            'User-Agent': 'PagePulse-AuditBot/1.0 (+https://digitalheroesco.com)',
            Accept: 'text/html,application/xhtml+xml',
          },
          maxRedirects: 5,
          validateStatus: () => true, // Accept any status to audit error pages
        });

        const responseTimeMs = Date.now() - startTime;
        const html = response.data;
        const contentType = String(response.headers['content-type'] || '');

        if (typeof html !== 'string' || !contentType.includes('html')) {
          throw new AppError(422, 'UNSUPPORTED_CONTENT_TYPE', 'Target URL did not return HTML content.');
        }

        const $ = cheerio.load(html);

        const parsedUrl = new URL(targetUrl);

        return {
          url: targetUrl,
          auditTimestamp: new Date().toISOString(),
          performance: {
            responseTimeMs,
            statusCode: response.status,
            contentLengthBytes: Buffer.byteLength(html, 'utf8'),
          },
          seo: {
            title: $('title').text().trim() || null,
            metaDescription: $('meta[name="description"]').attr('content')?.trim() || null,
            h1Count: $('h1').length,
            canonicalUrl: $('link[rel="canonical"]').attr('href')?.trim() || null,
            openGraphTitle: $('meta[property="og:title"]').attr('content')?.trim() || null,
            openGraphImage: $('meta[property="og:image"]').attr('content')?.trim() || null,
          },
          security: {
            isHttps: parsedUrl.protocol === 'https:',
            hasStrictTransportSecurity: Boolean(response.headers['strict-transport-security']),
            hasContentSecurityPolicy: Boolean(response.headers['content-security-policy']),
          },
        };
      } catch (err: unknown) {
        if (err instanceof AppError) throw err;

        if (axios.isAxiosError(err)) {
          if (err.code === 'ECONNABORTED') {
            throw new AppError(504, 'AUDIT_TIMEOUT', `Request to ${targetUrl} timed out after ${env.AUDIT_TIMEOUT_MS}ms`);
          }
          if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
            throw new AppError(400, 'HOST_UNREACHABLE', `Could not reach network host for ${targetUrl}`);
          }
        }

        throw new AppError(500, 'AUDIT_FAILED', `Failed to complete audit: ${(err as Error).message}`);
      }
    });
  }
}

export const auditService = new AuditService();