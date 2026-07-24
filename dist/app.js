"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const audit_routes_1 = __importDefault(require("./routes/audit.routes"));
const requestId_1 = require("./middleware/requestId");
const rateLimiter_1 = require("./middleware/rateLimiter");
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(requestId_1.requestIdMiddleware);
// Serve static frontend dashboard
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
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
app.use('/api/v1', rateLimiter_1.apiRateLimiter, audit_routes_1.default);
// Centralized Error Handling
app.use(errorHandler_1.errorHandler);
exports.default = app;
