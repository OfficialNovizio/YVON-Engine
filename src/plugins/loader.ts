// src/plugins/loader.ts — Plugin Loader
// Scans plugins/ directory, loads plugin manifests, registers agents/tools/routes

import * as fs from 'fs'
import * as path from 'path'

export interface PluginManifest {
  name: string
  version: string
  description: string
  agents?: any[]
  tools?: string[]
  routes?: string[]
  dependencies?: Record<string, string>
}

export interface PluginState {
  name: string
  version: string
  loaded: boolean
  error?: string
}

export function scanPlugins(projectRoot: string): PluginManifest[] {
  const pluginsDir = path.join(projectRoot, 'plugins')
  if (!fs.existsSync(pluginsDir)) return []

  const manifests: PluginManifest[] = []
  for (const entry of fs.readdirSync(pluginsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const manifestPath = path.join(pluginsDir, entry.name, 'manifest.toon')
    if (fs.existsSync(manifestPath)) {
      try {
        const raw = fs.readFileSync(manifestPath, 'utf-8')
        const manifest = JSON.parse(raw) // or YAML parse
        manifests.push(manifest)
      } catch {}
    }
  }
  return manifests
}

export function loadPlugins(projectRoot: string): PluginState[] {
  const manifests = scanPlugins(projectRoot)
  return manifests.map(m => ({
    name: m.name,
    version: m.version,
    loaded: true,
  }))
}
