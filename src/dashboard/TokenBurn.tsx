import React from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { TokenBurnData } from './types'

const CHART_COLORS = ['#5ee0ff', '#c08bff', '#5fd0b4', '#ffb693', '#ff8a80', '#ffa726', '#abc7ff']
const darkStyle = { axis: '#ffffff20', text: '#8892a8', grid: '#ffffff08', tooltip: { bg: '#1a1d28', border: '#ffffff10', text: '#e4e8f0' } }

interface Props { data: TokenBurnData }

export function TokenBurn({ data }: Props) {
  if (!data) return <div className="text-on-surface-variant text-sm p-8 text-center">No token data available. Run `hermes insights` on the server.</div>

  return (
    <div className="space-y-4">
      {/* Token Usage 30d + Cost by Dept */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
        <div className="glass-card p-4">
          <div className="text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">Token Usage (30d)</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.tokenUsage}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkStyle.grid} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: darkStyle.text }} stroke={darkStyle.axis} />
              <YAxis tick={{ fontSize: 10, fill: darkStyle.text }} stroke={darkStyle.axis} tickFormatter={v => `${(v/1e6).toFixed(0)}M`} />
              <Tooltip contentStyle={{ background: darkStyle.tooltip.bg, border: `1px solid ${darkStyle.tooltip.border}`, borderRadius: 8, color: darkStyle.tooltip.text, fontSize: 12 }} />
              <Line type="monotone" dataKey="tokens" stroke="#5ee0ff" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="text-[11px] text-on-surface-variant mt-2">
            Avg: {(data.tokenUsage.reduce((s,d) => s+d.tokens, 0) / Math.max(1, data.tokenUsage.length) / 1e6).toFixed(0)}M/day · Total: {(data.tokenUsage.reduce((s,d) => s+d.tokens, 0) / 1e6).toFixed(0)}M
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">Cost by Department</div>
          <div className="space-y-2">
            {data.costByDept.map((d, i) => (
              <div key={d.department}>
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className="text-on-surface-variant">{d.department}</span>
                  <span className="text-on-surface tabular-nums">{d.percentage}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/[0.04]">
                  <div className="h-2 rounded-full transition-all" style={{ width: `${d.percentage}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cost Trend + Provider Health */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div className="glass-card p-4">
          <div className="text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">Cost Trend (30d)</div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={data.costTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkStyle.grid} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: darkStyle.text }} stroke={darkStyle.axis} />
              <YAxis tick={{ fontSize: 10, fill: darkStyle.text }} stroke={darkStyle.axis} tickFormatter={v => `$${v.toFixed(2)}`} />
              <Tooltip contentStyle={{ background: darkStyle.tooltip.bg, border: `1px solid ${darkStyle.tooltip.border}`, borderRadius: 8, color: darkStyle.tooltip.text, fontSize: 12 }} />
              <Line type="monotone" dataKey="cost" stroke="#f87171" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="text-[11px] text-on-surface-variant mt-2">
            Avg: ${(data.costTrend.reduce((s,d) => s+d.cost, 0) / Math.max(1, data.costTrend.length)).toFixed(2)}/day · Proj: ${(data.costTrend.reduce((s,d) => s+d.cost, 0) / Math.max(1, data.costTrend.length) * 30).toFixed(2)}/mo
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">Provider Health</div>
          <div className="space-y-3">
            {data.providerHealth.map(p => (
              <div key={p.provider}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className={p.configured ? 'text-on-surface' : 'text-on-surface-variant/40'}>{p.provider}</span>
                  <span className="tabular-nums text-on-surface-variant">{p.usagePercent}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/[0.04]">
                  <div className="h-1.5 rounded-full transition-all" style={{ width: `${p.usagePercent}%`, background: p.configured ? '#5ee0ff' : '#ffffff15' }} />
                </div>
                {p.balance != null && (
                  <div className="text-[10px] text-on-surface-variant mt-0.5">${p.balance.toFixed(2)} balance</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Per-Agent Burn */}
      <div className="glass-card p-4">
        <div className="text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">Per-Agent Burn (Top Consumers)</div>
        <ResponsiveContainer width="100%" height={Math.max(200, data.perAgentBurn.length * 32)}>
          <BarChart data={data.perAgentBurn} layout="vertical" margin={{ left: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={darkStyle.grid} />
            <XAxis type="number" tick={{ fontSize: 10, fill: darkStyle.text }} stroke={darkStyle.axis} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
            <YAxis type="category" dataKey="agent" tick={{ fontSize: 11, fill: darkStyle.text }} stroke={darkStyle.axis} width={80} />
            <Tooltip contentStyle={{ background: darkStyle.tooltip.bg, border: `1px solid ${darkStyle.tooltip.border}`, borderRadius: 8, color: darkStyle.tooltip.text, fontSize: 12 }}
              formatter={(_val: any) => { const v = Number(_val); return `${(v/1000).toFixed(0)}K tokens · $${((v/1e6)*0.14).toFixed(2)}` }} />
            <Bar dataKey="tokens" fill="#5ee0ff" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
