// lib/cie/sources/graphify.ts — Code structure knowledge graph source
import { readFileSync, existsSync, statSync } from 'fs'
import { getConfig } from '../../adapters/config'

export interface GraphifyCommunity { name: string; cohesion: number; nodes: string[] }

let cachedCommunities: GraphifyCommunity[] | null = null
let cachedMtime: number = 0

export function getGraphifyReport(): { communities: GraphifyCommunity[] } {
  const config = getConfig()
  const path = config.graphifyReport
  if (!existsSync(path)) return { communities: [] }
  
  const mtime = statSync(path).mtimeMs
  if (cachedCommunities && cachedMtime === mtime) return { communities: cachedCommunities }
  
  const content = readFileSync(path, 'utf-8')
  const communities = parseCommunities(content)
  cachedCommunities = communities
  cachedMtime = mtime
  return { communities }
}

function parseCommunities(content: string): GraphifyCommunity[] {
  const communities: GraphifyCommunity[] = []
  const sections = content.split(/### Community \d+ - /)
  for (const section of sections.slice(1)) {
    const nameMatch = section.match(/^"([^"]+)"/)
    const cohesionMatch = section.match(/Cohesion:\s*([\d.]+)/)
    const nodesMatch = section.match(/Nodes\s*\((\d+)\):\s*(.+)/)
    if (nameMatch && cohesionMatch && nodesMatch) {
      const nodes = nodesMatch[2].split(',').map(n => n.trim().replace(/\(.*\)/, ''))
      communities.push({ name: nameMatch[1], cohesion: parseFloat(cohesionMatch[1]), nodes })
    }
  }
  return communities
}

export function queryGraphify(keywords: string[]): string {
  const { communities } = getGraphifyReport()
  const scored = communities
    .filter(c => c.cohesion > 0.05 && c.nodes.length > 0)
    .map(c => {
      const hits = c.nodes.filter(n => keywords.some(k => n.toLowerCase().includes(k.toLowerCase())))
      return { ...c, score: hits.length }
    })
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score)
  
  return scored.slice(0, 3).map(c => `G|${c.name}|${c.cohesion}|${c.nodes.slice(0,5).join(',')}`).join('\n')
}

export function invalidateGraphifyCache(): void { cachedCommunities = null }
