"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditController = void 0;
const zod_1 = require("zod");
const audit_service_1 = require("../services/audit.service");
const cache_service_1 = require("../services/cache.service");
const logger_1 = require("../utils/logger");
const errorHandler_1 = require("../middleware/errorHandler");
const auditQuerySchema = zod_1.z.object({
    url: zod_1.z.string().url('Invalid URL format. Must include protocol (http:// or https://)'),
    bypassCache: zod_1.z
        .string()
        .optional()
        .transform((val) => val === 'true'),
});
const auditController = async (req, res, next) => {
    try {
        const parseResult = auditQuerySchema.safeParse(req.query);
        if (!parseResult.success) {
            const firstError = parseResult.error.errors[0]?.message || 'Invalid query parameters';
            throw new errorHandler_1.AppError(400, 'INVALID_INPUT', firstError);
        }
        const { url: targetUrl, bypassCache } = parseResult.data;
        const cacheKey = `audit:${targetUrl}`;
        if (!bypassCache) {
            const cachedResult = await cache_service_1.cacheService.get(cacheKey);
            if (cachedResult) {
                logger_1.logger.info({ requestId: req.id, url: targetUrl }, 'Served audit from cache');
                return res.status(200).json({
                    status: 'success',
                    data: {
                        ...cachedResult,
                        cached: true,
                    },
                });
            }
        }
        logger_1.logger.info({ requestId: req.id, url: targetUrl }, 'Running fresh URL audit');
        const auditData = await audit_service_1.auditService.performAudit(targetUrl);
        await cache_service_1.cacheService.set(cacheKey, auditData);
        return res.status(200).json({
            status: 'success',
            data: {
                ...auditData,
                cached: false,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.auditController = auditController;
