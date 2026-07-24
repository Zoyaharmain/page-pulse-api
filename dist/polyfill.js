"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const web_1 = require("stream/web");
if (!globalThis.ReadableStream) {
    globalThis.ReadableStream = web_1.ReadableStream;
}
