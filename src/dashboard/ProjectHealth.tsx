import React from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { ProjectHealthData } from './types'

const darkStyle = { axis: '#ffffff20', text: '#8892a8', grid: '#ffffff08', tooltip: { bg: '#1a1d28', border: '#ffffff10', text: '#e4e8f0' } }

function gradeColor(percent: number) {
  if (percent >= 95) return '#34d399'
  if (percent >= 90) return '#5ee0ff'
  if (percent >= 80) return '#f59e0b'
  return '#f87171'
}

function gradeLabel(percent: number) {
  if (percent >= 95) return 'A+'
  if (percent >= 90) return 'A'
  if (percent >= 80) return 'B'
  return 'C'
}

function KpiCard({ emoji, label, value, sub }: { emoji: string; label: string; value: string | number; sub: string }) {
  return (
    <div className="glass-card p-4 text-center">
      <div className="text-2xl mb-1">{emoji}</div>
      <div className="text-2xl font-bold text-on-surface">{value}</div>
      <div className="text-[11px] text-on-surface-variant font-semibold">{label}</div>
      <div className="text-[10px] text-on-surface-variant/60 mt-0.5">{sub}</div>
    </div>
  )
}

interface Props { data: ProjectHealthData }

export function ProjectHealth({ data }: Props) {
  if (!data) return <div className="text-on-surface-variant text-sm p-8 text-center">No project health data available.</div>

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard emoji="🧬" label="TOON HEALTH" value={`${data.kpi.toonAvg}%`} sub="A+ grade" />
        <KpiCard emoji="📦" label="BUNDLE HEALTH" value={`${data.kpi.bundleSize} pg`} sub="↓0 builds" />
        <KpiCard emoji="⚡" label="API HEALTH" value={`${data.kpi.apiSuccess}%`} sub="success" />
        <div className="glass-card p-4 text-center">
          <div className="text-2xl mb-1">🔧</div>
          <div className="text-2xl font-bold text-on-surface flex items-center justify-center gap-2">
            {data.kpi.issuesOpen}
            {data.kpi.issuesCritical > 0 && <span className="text-sm text-red-400">{data.kpi.issuesCritical} 🔴</span>}
          </div>
          <div className="text-[11px] text-on-surface-variant font-semibold">ISSUES OPEN</div>
          <div className="text-[10px] text-on-surface-variant/60 mt-0.5">{data.kpi.issuesCritical} 🔴</div>
        </div>
      </div>

      {/* TOON Compression Quality */}
      <div className="glass-card p-4">
        <div className="text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">🧬 TOON Compression Quality</div>
        <div className="space-y-2">
          {data.toonQuality.map(c => (
            <div key={c.category}>
              <div className="flex justify-between text-[11px] mb-0.5">
                <span className="text-on-surface-variant">{c.category}</span>
                <span className="tabular-nums" style={{ color: gradeColor(c.percent) }}>{c.percent}% {c.grade}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/[0.04]">
                <div className="h-2 rounded-full" style={{ width: `${c.percent}%`, background: gradeColor(c.percent) }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2 text-[10px]">
          <span className="text-on-surface-variant/60">Grade curve:</span>
          {data.toonQuality.map(c => (
            <span key={c.category} style={{ color: gradeColor(c.percent) }}>{c.grade}</span>
          ))}
        </div>
        {data.toonQuality.some(c => c.percent < 90) && (
          <div className="mt-2 text-[11px] text-amber-400">
            ⚠️ {data.toonQuality.filter(c => c.percent < 90).map(c => c.category).join(', ')} below 90% — check encoding strategy
          </div>
        )}
      </div>

      {/* Savings Trend + Top-K Match */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="glass-card p-4">
          <div className="text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">📊 Savings Trend (7d)</div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={data.savingsTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkStyle.grid} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: darkStyle.text }} stroke={darkStyle.axis} />
              <YAxis domain={[80, 100]} tick={{ fontSize: 10, fill: darkStyle.text }} stroke={darkStyle.axis} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={{ background: darkStyle.tooltip.bg, border: `1px solid ${darkStyle.tooltip.border}`, borderRadius: 8, color: darkStyle.tooltip.text, fontSize: 12 }} />
              <Line type="monotone" dataKey="percent" stroke="#34d399" strokeWidth={2} dot={{ r: 3, fill: '#34d399' }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="text-[11px] text-on-surface-variant mt-1">
            Avg: {data.savingsTrend.length > 0 ? (data.savingsTrend.reduce((s,d)=>s+d.percent,0)/data.savingsTrend.length).toFixed(0) : '—'}%
            {data.savingsTrend.length > 1 && data.savingsTrend[data.savingsTrend.length-1].percent > data.savingsTrend[0].percent
              ? ` · ↑${(data.savingsTrend[data.savingsTrend.length-1].percent - data.savingsTrend[0].percent).toFixed(0)}%`
              : ''} · Stable trend ✅
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">🔍 Top-K Match Quality</div>
          <div className="space-y-3 text-[13px] text-on-surface-variant">
            <div className="flex justify-between"><span>Chunks matched:</span><span className="text-on-surface font-semibold">{data.topKMatch.chunksMatched} avg</span></div>
            <div className="flex justify-between"><span>Chunks injected:</span><span className="text-on-surface font-semibold">{data.topKMatch.chunksInjected} avg</span></div>
            <div className="mt-3">
              <div className="text-[11px] mb-2">Injection level</div>
              <div className="space-y-1.5">
                <div>
                  <div className="flex justify-between text-[11px]"><span>L1</span><span>{data.topKMatch.l1}%</span></div>
                  <div className="h-1.5 w-full rounded-full bg-white/[0.04]"><div className="h-1.5 rounded-full bg-[#34d399]" style={{ width: `${data.topKMatch.l1}%` }} /></div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px]"><span>L2</span><span>{data.topKMatch.l2}%</span></div>
                  <div className="h-1.5 w-full rounded-full bg-white/[0.04]"><div className="h-1.5 rounded-full bg-[#5ee0ff]" style={{ width: `${data.topKMatch.l2}%` }} /></div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px]"><span>REF</span><span>{data.topKMatch.ref}%</span></div>
                  <div className="h-1.5 w-full rounded-full bg-white/[0.04]"><div className="h-1.5 rounded-full bg-[#c08bff]" style={{ width: `${data.topKMatch.ref}%` }} /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Codebase Structure */}
      <div className="glass-card p-4">
        <div className="text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">📦 Codebase Structure</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[13px]">
          {[
            { label: 'Last compile', value: `${data.codebase.lastCompile} (${data.codebase.duration}) ${data.codebase.tsErrors === 0 ? '✅' : '⚠️'}` },
            { label: 'Files scanned', value: data.codebase.files.toLocaleString() },
            { label: 'Chunks built', value: data.codebase.chunks.toLocaleString() },
            { label: 'Terms indexed', value: data.codebase.terms.toLocaleString() },
            { label: 'BPE tokens', value: data.codebase.bpe.toLocaleString() },
            { label: 'Corpus size', value: `${data.codebase.corpusSize} → ${data.codebase.compressedSize} (${data.codebase.compressionPercent}%)` },
            { label: 'Δ since last', value: data.codebase.delta },
            { label: 'TypeScript', value: `${data.codebase.tsErrors} errors ${data.codebase.tsErrors === 0 ? '✅' : '⚠️'}` },
          ].map(s => (
            <div key={s.label} className="bg-white/[0.02] rounded-lg p-2.5">
              <div className="text-[10px] text-on-surface-variant/60 uppercase mb-0.5">{s.label}</div>
              <div className="text-on-surface font-semibold">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* API Route Health + Prompt Quality */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="glass-card p-4">
          <div className="text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">⚡ API Route Health</div>
          <div className="space-y-2">
            {[
              { code: 200, percent: data.apiHealth.status200, color: '#34d399' },
              { code: 400, percent: data.apiHealth.status400, color: '#f59e0b' },
              { code: 500, percent: data.apiHealth.status500, color: '#f87171' },
            ].map(s => (
              <div key={s.code}>
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className="text-on-surface-variant">{s.code}</span>
                  <span className="tabular-nums text-on-surface">{s.percent}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/[0.04]">
                  <div className="h-2 rounded-full" style={{ width: `${s.percent}%`, background: s.color }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[11px] text-on-surface-variant">
            24h: {data.apiHealth.total24h.toLocaleString()} calls · Errors: {data.apiHealth.errors}
          </div>
          {data.apiHealth.topError && (
            <div className="mt-1 text-[11px] text-amber-400">⚠️ {data.apiHealth.topError}</div>
          )}
        </div>

        <div className="glass-card p-4">
          <div className="text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">🧠 Prompt Quality</div>
          <div className="space-y-2 text-[13px] text-on-surface-variant">
            <div className="flex justify-between"><span>Avg context:</span><span className="text-on-surface">{data.promptQuality.avgContext}</span></div>
            <div className="flex justify-between"><span>Avg injected:</span><span className="text-on-surface">{data.promptQuality.avgInjected}</span></div>
            <div className="flex justify-between"><span>Reduction:</span><span className="text-on-surface font-semibold" style={{ color: '#34d399' }}>{data.promptQuality.reduction}%</span></div>
            <div className="flex justify-between"><span>Cache hits:</span><span className="text-on-surface">{data.promptQuality.cacheHits}%</span></div>
            <div className="flex justify-between"><span>Cache miss:</span><span className="text-on-surface">{100 - data.promptQuality.cacheHits}%</span></div>
            <div className="flex justify-between"><span>Best agent:</span><span className="text-on-surface" style={{ color: '#34d399' }}>{data.promptQuality.bestAgent} {data.promptQuality.reduction}%</span></div>
            <div className="flex justify-between"><span>Worst agent:</span><span className="text-on-surface" style={{ color: '#f59e0b' }}>{data.promptQuality.worstAgent} 82%</span></div>
          </div>
        </div>
      </div>

      {/* Issues & Anomalies */}
      <div className="glass-card p-4">
        <div className="text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">🔧 Issues & Anomalies</div>
        <div className="space-y-2">
          {data.issues.map((issue, i) => (
            <div key={i} className="flex items-start gap-2.5 rounded-lg bg-white/[0.02] p-2.5 text-[12px]">
              <span className="mt-0.5">
                {issue.severity === 'error' ? '🔴' : issue.severity === 'warning' ? '⚠️' : '✅'}
              </span>
              <div>
                <span className="text-on-surface-variant/60 tabular-nums mr-2">{issue.time}</span>
                <span className={issue.severity === 'error' ? 'text-red-400' : issue.severity === 'warning' ? 'text-amber-400' : 'text-on-surface-variant'}>
                  {issue.message}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Documentation Coverage */}
      <div className="glass-card p-4">
        <div className="text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">📚 Documentation Coverage</div>
        <div className="space-y-2">
          {data.docCoverage.map(d => (
            <div key={d.dir}>
              <div className="flex justify-between text-[11px] mb-0.5">
                <span className="text-on-surface-variant">{d.dir}/</span>
                <span className="tabular-nums" style={{ color: gradeColor(d.percent) }}>
                  {d.percent}% {d.covered}/{d.total}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/[0.04]">
                <div className="h-2 rounded-full" style={{ width: `${d.percent}%`, background: gradeColor(d.percent) }} />
              </div>
              {d.percent < 70 && (
                <div className="text-[10px] text-amber-400 mt-0.5">⚠️ {d.total - d.covered} undocumented</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
