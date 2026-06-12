"use strict";
// src/dashboard/index.ts
// Dashboard v2 — Express server with REST API, WebSocket, and React SPA.
// Replaces the old inlined HTML dashboard (v1).
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
exports.startDashboard = startDashboard;
exports.stopDashboard = stopDashboard;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const path_1 = require("path");
const fs_1 = require("fs");
const collector_1 = require("../metrics/collector");
const health_checks_1 = require("../metrics/health-checks");
const agent_tracker_1 = require("../metrics/agent-tracker");
const api_1 = __importStar(require("./api"));
const ws_1 = require("./ws");
const DEFAULT_PORT = 4200;
function startDashboard(port = DEFAULT_PORT) {
    collector_1.metrics.enable();
    (0, agent_tracker_1.initAgentActivities)();
    (0, health_checks_1.runHealthChecks)();
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    // API routes
    app.use('/api', api_1.default);
    app.use('/api/simulator', (0, api_1.providerSimulatorRoutes)());
    // Serve React SPA if built, otherwise fallback to basic HTML
    // In dev (ts-node): __dirname = src/dashboard, ui at ui/dist
    // In prod (compiled): __dirname = dist/dashboard, ui at ../../src/dashboard/ui/dist
    const uiDistCandidates = [
        (0, path_1.join)(__dirname, 'ui', 'dist'),
        (0, path_1.join)(__dirname, '..', '..', 'src', 'dashboard', 'ui', 'dist'),
    ];
    let uiDist = '';
    for (const cand of uiDistCandidates) {
        if ((0, fs_1.existsSync)((0, path_1.join)(cand, 'index.html'))) {
            uiDist = cand;
            break;
        }
    }
    if ((0, fs_1.existsSync)((0, path_1.join)(uiDist, 'index.html'))) {
        // Serve static files from React build
        app.use(express_1.default.static(uiDist));
        // SPA fallback: non-API, non-file requests → index.html
        app.use((_req, _res, next) => {
            if (_req.url && _req.url.startsWith('/api'))
                return next();
            if (_req.url && _req.url.includes('.'))
                return next();
            _res.sendFile((0, path_1.join)(uiDist, 'index.html'));
        });
    }
    else {
        app.get('/', (_req, res) => {
            res.send(`<!DOCTYPE html><html><head><title>YVON Dashboard v2</title><meta charset="UTF-8"><style>body{background:#0a0e17;color:#e4e8f0;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}div{text-align:center}h1{font-size:2rem;margin-bottom:.5rem}p{color:#5a6478}a{color:#00d4ff}</style></head><body><div><h1>⚡ YVON Dashboard v2</h1><p>API running on port ${port}</p><p>React UI not built yet — run <code>npm run build:dashboard</code></p><p><a href="/api/health">API Health →</a> · <a href="/api/modules">Modules →</a> · <a href="/api/toon/stats">TOON →</a></p></div></body></html>`);
        });
    }
    const server = (0, http_1.createServer)(app);
    (0, ws_1.attachWebSocket)(server);
    server.listen(port, () => {
        console.log(`\n  ⚡ YVON Dashboard v2 — http://localhost:${port}`);
        console.log(`  📊 API: http://localhost:${port}/api/health`);
        console.log(`  🔌 Live: ws://localhost:${port}/api/live\n`);
    });
}
function stopDashboard() {
    (0, ws_1.stopWebSocket)();
    collector_1.metrics.disable();
}
//# sourceMappingURL=index.js.map