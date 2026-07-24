"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
const logger_1 = require("../utils/logger");
class AppError extends Error {
    constructor(statusCode, code, message) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.AppError = AppError;
const errorHandler = (err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
next) => {
    const requestId = req.id || 'unknown';
    if (err instanceof AppError) {
        logger_1.logger.warn({ requestId, err: err.message, code: err.code }, 'Handled operational error');
        return res.status(err.statusCode).json({
            error: {
                code: err.code,
                message: err.message,
                requestId,
                timestamp: new Date().toISOString(),
            },
        });
    }
    logger_1.logger.error({ requestId, err: err.stack }, 'Unhandled application error');
    return res.status(500).json({
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected internal error occurred.',
            requestId,
            timestamp: new Date().toISOString(),
        },
    });
};
exports.errorHandler = errorHandler;
