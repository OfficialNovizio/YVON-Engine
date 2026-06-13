"use strict";
// src/plugins/loader.ts — Plugin Loader
// Scans plugins/ directory, loads plugin manifests, registers agents/tools/routes
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanPlugins = scanPlugins;
exports.loadPlugins = loadPlugins;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function scanPlugins(projectRoot) {
    const pluginsDir = path.join(projectRoot, 'plugins');
    if (!fs.existsSync(pluginsDir))
        return [];
    const manifests = [];
    for (const entry of fs.readdirSync(pluginsDir, { withFileTypes: true })) {
        if (!entry.isDirectory())
            continue;
        const manifestPath = path.join(pluginsDir, entry.name, 'manifest.toon');
        if (fs.existsSync(manifestPath)) {
            try {
                const raw = fs.readFileSync(manifestPath, 'utf-8');
                const manifest = JSON.parse(raw); // or YAML parse
                manifests.push(manifest);
            }
            catch { }
        }
    }
    return manifests;
}
function loadPlugins(projectRoot) {
    const manifests = scanPlugins(projectRoot);
    return manifests.map(m => ({
        name: m.name,
        version: m.version,
        loaded: true,
    }));
}
//# sourceMappingURL=loader.js.map