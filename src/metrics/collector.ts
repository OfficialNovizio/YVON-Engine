// src/metrics/collector.ts
// Singleton metrics collector. Zero overhead when disabled.

import type { ToonCall, CiePipelineTick, ModuleStatus, AgentActivity, ToonStats, CieStats, CostSummary } from './types'

class MetricsCollector {
  private enabled = false
  private toonCalls: ToonCall[] = []
  private cieTicks: CiePipelineTick[] = []
  private moduleStatuses: Map<string, ModuleStatus> = new Map()
  private agentActivities: Map<string, AgentActivity> = new Map()

  enable() { this.enabled = true }
  disable() { this.enabled = false }
  isEnabled(): boolean { return this.enabled }

  recordToonCall(call: ToonCall): void {
    if (!this.enabled) return
    this.toonCalls.push(call)
    if (this.toonCalls.length > 10000) this.toonCalls.shift()
  }

  recordCieTick(tick: CiePipelineTick): void {
    if (!this.enabled) return
    this.cieTicks.push(tick)
    if (this.cieTicks.length > 10000) this.cieTicks.shift()
  }

  setModuleStatus(status: ModuleStatus): void {
    this.moduleStatuses.set(status.name, status)
  }

  setAgentActivity(activity: AgentActivity): void {
    this.agentActivities.set(activity.agentId, activity)
  }

  getToonStats(): ToonStats {
    const calls = this.toonCalls
    if (calls.length === 0) return { total: 0, totalInputTokens: 0, totalOutputTokens: 0, totalBytesSaved: 0, totalCostSaved: 0, avgSavingsPercent: 0, byModel: {} }
    const byModel: Record<string, { calls: number; costSaved: number }> = {}
    let totalInput = 0, totalOutput = 0, totalBytes = 0, totalCost = 0
    for (const c of calls) {
      totalInput += c.inputTokens
      totalOutput += c.outputTokens
      totalBytes += (c.bytesBefore - c.bytesAfter)
      totalCost += c.costSaved
      if (!byModel[c.model]) byModel[c.model] = { calls: 0, costSaved: 0 }
      byModel[c.model].calls++
      byModel[c.model].costSaved += c.costSaved
    }
    const avgSavings = calls.reduce((s, c) => s + ((c.bytesBefore - c.bytesAfter) / Math.max(1, c.bytesBefore)), 0) / calls.length * 100
    return {
      total: calls.length,
      totalInputTokens: totalInput,
      totalOutputTokens: totalOutput,
      totalBytesSaved: totalBytes,
      totalCostSaved: Math.round(totalCost * 10000) / 10000,
      avgSavingsPercent: Math.round(avgSavings * 10) / 10,
      byModel,
    }
  }

  getCieStats(): CieStats {
    const ticks = this.cieTicks
    if (ticks.length === 0) return { totalTicks: 0, totalRetrieved: 0, totalInjected: 0, totalFiltered: 0, avgLatencyMs: 0, skipRate: 0 }
    const skipped = ticks.filter(t => t.skipped).length
    return {
      totalTicks: ticks.length,
      totalRetrieved: ticks.reduce((s, t) => s + t.retrieved, 0),
      totalInjected: ticks.reduce((s, t) => s + t.injected, 0),
      totalFiltered: ticks.reduce((s, t) => s + t.filtered, 0),
      avgLatencyMs: Math.round(ticks.reduce((s, t) => s + t.latencyMs, 0) / ticks.length),
      skipRate: Math.round((skipped / ticks.length) * 100),
    }
  }

  getCostSummary(): CostSummary {
    const byModel: Record<string, { calls: number; inputTokens: number; outputTokens: number; cost: number }> = {}
    let totalSaved = 0
    for (const c of this.toonCalls) {
      if (!byModel[c.model]) byModel[c.model] = { calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 }
      byModel[c.model].calls++
      byModel[c.model].inputTokens += c.inputTokens
      byModel[c.model].outputTokens += c.outputTokens
      const estimatedCost = (c.inputTokens / 1_000_000) * 3 + (c.outputTokens / 1_000_000) * 15
      byModel[c.model].cost += estimatedCost
      totalSaved += c.costSaved
    }
    const totalSpent = Object.values(byModel).reduce((s, m) => s + m.cost, 0)
    return {
      byModel,
      totalSpent: Math.round(totalSpent * 10000) / 10000,
      totalSaved: Math.round(totalSaved * 10000) / 10000,
      netCost: Math.round((totalSpent - totalSaved) * 10000) / 10000,
    }
  }

  getModuleStatuses(): ModuleStatus[] { return [...this.moduleStatuses.values()] }
  getAllAgentActivities(): AgentActivity[] { return [...this.agentActivities.values()] }
  getToonCalls(limit = 100): ToonCall[] { return this.toonCalls.slice(-limit) }
  getCieTicks(limit = 100): CiePipelineTick[] { return this.cieTicks.slice(-limit) }

  clear(): void {
    this.toonCalls = []
    this.cieTicks = []
    this.moduleStatuses.clear()
    this.agentActivities.clear()
  }
}

export const metrics = new MetricsCollector()
