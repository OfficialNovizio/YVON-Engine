"use strict";
// src/dashboard/ws.ts
// WebSocket server for live dashboard updates.
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachWebSocket = attachWebSocket;
exports.stopWebSocket = stopWebSocket;
const ws_1 = require("ws");
const collector_1 = require("../metrics/collector");
const health_checks_1 = require("../metrics/health-checks");
let wss = null;
let interval = null;
function attachWebSocket(server) {
    wss = new ws_1.Server({ server, path: '/api/live' });
    wss.on('connection', (ws) => {
        sendStats(ws);
        ws.on('error', () => { });
    });
    interval = setInterval(() => {
        if (!wss)
            return;
        wss.clients.forEach(client => {
            if (client.readyState === ws_1.WebSocket.OPEN)
                sendStats(client);
        });
    }, 5000);
}
function sendStats(ws) {
    (0, health_checks_1.runHealthChecks)();
    const payload = JSON.stringify({
        type: 'stats',
        timestamp: Date.now(),
        toon: collector_1.metrics.getLiveToonStats(),
        cie: collector_1.metrics.getLiveCieStats(),
        cost: collector_1.metrics.getLiveCostSummary(),
        modules: collector_1.metrics.getModuleStatuses(),
        agents: collector_1.metrics.getAllAgentActivities(),
    });
    ws.send(payload);
}
function stopWebSocket() {
    if (interval)
        clearInterval(interval);
    if (wss)
        wss.close();
}
//# sourceMappingURL=ws.js.map