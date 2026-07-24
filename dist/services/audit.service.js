"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditService = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const p_limit_1 = __importDefault(require("p-limit"));
const env_1 = require("../config/env");
const errorHandler_1 = require("../middleware/errorHandler");
class AuditService {
    constructor() {
        this.limit = (0, p_limit_1.default)(env_1.env.MAX_CONCURRENT_AUDITS);
    }
    async performAudit(targetUrl) {
        return this.limit(async () => {
            const startTime = Date.now();
            try {
                const response = await axios_1.default.get(targetUrl, {
                    timeout: env_1.env.AUDIT_TIMEOUT_MS,
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
                    throw new errorHandler_1.AppError(422, 'UNSUPPORTED_CONTENT_TYPE', 'Target URL did not return HTML content.');
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
            }
            catch (err) {
                if (err instanceof errorHandler_1.AppError)
                    throw err;
                if (axios_1.default.isAxiosError(err)) {
                    if (err.code === 'ECONNABORTED') {
                        throw new errorHandler_1.AppError(504, 'AUDIT_TIMEOUT', `Request to ${targetUrl} timed out after ${env_1.env.AUDIT_TIMEOUT_MS}ms`);
                    }
                    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
                        throw new errorHandler_1.AppError(400, 'HOST_UNREACHABLE', `Could not reach network host for ${targetUrl}`);
                    }
                }
                throw new errorHandler_1.AppError(500, 'AUDIT_FAILED', `Failed to complete audit: ${err.message}`);
            }
        });
    }
}
exports.auditService = new AuditService();
