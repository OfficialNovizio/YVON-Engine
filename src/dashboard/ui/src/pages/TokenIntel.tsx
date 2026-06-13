import React, { useState, useRef, useEffect } from 'react';
import { usePolling } from '../hooks/usePolling';
import { Sparkline } from '../components/Sparkline';

/* ── styles ──────────────────────────────────────────────── */
const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 14,
  padding: 20,
  backdropFilter: 'blur(16px)',
  marginBottom: 20,
};

const SECTION_TITLE: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  color: '#e4e8f0',
  marginBottom: 16,
};

const MUTED: React.CSSProperties = {
  fontSize: 13,
  color: '#5a6478',
  textAlign: 'center' as const,
  padding: '40px 0',
};

const CENTER: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: 200,
  color: '#5a6478',
  fontSize: 15,
};

const TH: React.CSSProperties = {
  textAlign: 'left' as const,
  fontSize: 11,
  fontWeight: 600,
  color: '#5a6478',
  textTransform: 'uppercase' as const,
  letterSpacing: 0.5,
  padding: '8px 12px',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  cursor: 'pointer',
};

const TD: React.CSSProperties = {
  fontSize: 13,
  color: '#e4e8f0',
  padding: '10px 12px',
  borderBottom: '1px solid rgba(255,255,255,0.03)',
};

/* ── design tokens ───────────────────────────────────────── */
const C = {
  accent: '#00d4ff',
  green: '#10b981',
  yellow: '#f59e0b',
  red: '#ef4444',
  purple: '#8b5cf6',
  text: '#e4e8f0',
  muted: '#5a6478',
  glass: 'rgba(255,255,255,0.04)',
  glassBorder: 'rgba(255,255,255,0.08)',
};

/* ── types ───────────────────────────────────────────────── */
interface BurnSummary {
  totalTokens: number;
  toonSavedDollars: number;
  savedPercent: number;
  netCostDollars: number;
  totalCalls: number;
}

interface Budget {
  totalDollars: number;
  spentDollars: number;
  remainingDollars: number;
  projectedDays: number;
}

interface AgentBurn {
  agentName: string;
  tokens: number;
  cost: number;
  calls: number;
}

interface ModelMix {
  modelName: string;
  tokens: number;
  percent: number;
  cost: number;
}

interface BurnTimelinePoint {
  timestamp: string;
  tokens: number;
}

interface HourlyHeatmapPoint {
  hour: number;
  tokens: number;
}

interface LiveFeedEntry {
  id: string;
  timestamp: string;
  agentName: string;
  model: string;
  tokens: number;
  cost: number;
  action: string;
}

interface TokenBurnData {
  summary: BurnSummary;
  budget: Budget;
  agentBurn: AgentBurn[];
  modelMix: ModelMix[];
  burnTimeline: BurnTimelinePoint[];
  hourlyHeatmap: HourlyHeatmapPoint[];
  liveFeed: LiveFeedEntry[];
}

/* ── sub-components ──────────────────────────────────────── */

function KpiCard({ label, value, sub, delta }: {
  label: string; value: string; sub?: string; delta?: { value: string; better: boolean };
}) {
  return (
    <div style={{ ...CARD, marginBottom: 0, minWidth: 160 }}>
      <div style={{ fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: C.text, lineHeight: 1.1 }}>
        {value}
        {delta && (
          <span style={{
            fontSize: 14, color: delta.better ? C.green : C.red,
            marginLeft: 8, verticalAlign: 'middle',
          }}>
            {delta.better ? '↓' : '↑'} {delta.value}
          </span>
        )}
      </div>
      {sub && <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function TimeRangeSelector({ value, onChange }: {
  value: string; onChange: (v: 'today' | 'week' | 'month') => void;
}) {
  const opts: { key: 'today' | 'week' | 'month'; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
  ];
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
      {opts.map(o => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          style={{
            border: `1px solid ${value === o.key ? C.accent : C.glassBorder}`,
            background: value === o.key ? C.accent + '22' : C.glass,
            color: value === o.key ? C.accent : C.muted,
            borderRadius: 8,
            padding: '6px 16px',
            fontSize: 12,
            fontWeight: value === o.key ? 600 : 400,
            cursor: 'pointer',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function BudgetGauge({ budget }: { budget: Budget }) {
  const pct = Math.min((budget.spentDollars / budget.totalDollars) * 100, 100);
  const gaugeColor = pct > 80 ? C.red : pct > 50 ? C.yellow : C.green;
  return (
    <div style={CARD}>
      <h3 style={SECTION_TITLE}>📊 Budget Gauge</h3>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
        <span style={{ color: C.muted }}>$0</span>
        <span style={{ color: C.muted }}>${budget.totalDollars.toFixed(2)} limit</span>
      </div>
      <div style={{
        width: '100%', height: 14, borderRadius: 7,
        background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: 7,
          background: gaugeColor,
          transition: 'width 0.5s ease',
        }} />
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 8,
      }}>
        <span style={{ color: C.text, fontWeight: 600 }}>${budget.spentDollars.toFixed(2)} spent</span>
        <span style={{ color: C.muted }}>${budget.remainingDollars.toFixed(2)} remaining</span>
      </div>
      <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
        Projected {budget.projectedDays > 0 ? `${budget.projectedDays} days` : 'over budget'}
      </div>
    </div>
  );
}

type SortKey = 'tokens' | 'cost' | 'calls';

function AgentBurnTable({ agents }: { agents: AgentBurn[] }) {
  const [sort, setSort] = useState<SortKey>('tokens');
  const maxTokens = Math.max(...agents.map(a => a.tokens), 1);

  const sorted = [...agents].sort((a, b) => {
    if (sort === 'tokens') return b.tokens - a.tokens;
    if (sort === 'cost') return b.cost - a.cost;
    return b.calls - a.calls;
  });

  const th = (key: SortKey, label: string, align: 'left' | 'right' = 'right') => (
    <th
      style={{ ...TH, textAlign: align, cursor: 'pointer' }}
      onClick={() => setSort(key)}
    >
      {label} {sort === key ? '▼' : ''}
    </th>
  );

  if (agents.length === 0) return <div style={MUTED}>No agent burn data yet</div>;

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          {th('tokens', 'Agent', 'left')}
          {th('tokens', 'Tokens')}
          {th('cost', 'Cost')}
          {th('calls', 'Calls')}
        </tr>
      </thead>
      <tbody>
        {sorted.map((a, i) => (
          <tr key={i}>
            <td style={TD}>{a.agentName}</td>
            <td style={{ ...TD, textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                <div style={{
                  flex: '0 0 80px', height: 6, borderRadius: 3,
                  background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${(a.tokens / maxTokens) * 100}%`, height: '100%', borderRadius: 3,
                    background: C.accent, transition: 'width 0.4s ease',
                  }} />
                </div>
                <span>{(a.tokens / 1000).toFixed(1)}k</span>
              </div>
            </td>
            <td style={{ ...TD, textAlign: 'right', color: C.red }}>
              ${a.cost.toFixed(4)}
            </td>
            <td style={{ ...TD, textAlign: 'right' }}>{a.calls}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ModelMixTable({ models }: { models: ModelMix[] }) {
  const maxCost = Math.max(...models.map(m => m.cost), 1);
  const sorted = [...models].sort((a, b) => b.cost - a.cost);

  if (models.length === 0) return <div style={MUTED}>No model mix data yet</div>;

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={TH}>Model</th>
          <th style={{ ...TH, textAlign: 'right' }}>Share</th>
          <th style={{ ...TH, textAlign: 'right' }}>Cost</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((m, i) => (
          <tr key={i}>
            <td style={TD}>{m.modelName}</td>
            <td style={{ ...TD, textAlign: 'right', paddingTop: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                <div style={{
                  flex: '0 0 80px', height: 6, borderRadius: 3,
                  background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${(m.cost / maxCost) * 100}%`, height: '100%', borderRadius: 3,
                    background: C.purple, transition: 'width 0.4s ease',
                  }} />
                </div>
                <span style={{ fontSize: 11, color: C.muted, minWidth: 40, textAlign: 'right' }}>
                  {m.percent.toFixed(1)}%
                </span>
              </div>
            </td>
            <td style={{ ...TD, textAlign: 'right', color: C.red }}>
              ${m.cost.toFixed(4)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function BurnTimeline({ points }: { points: BurnTimelinePoint[] }) {
  if (points.length < 2) return <div style={MUTED}>No timeline data yet</div>;
  const values = points.map(p => p.tokens);
  return (
    <div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>TOKEN CONSUMPTION</div>
      <Sparkline data={values} width={600} height={48} color={C.accent} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.muted, marginTop: 4 }}>
        <span>{points[0]?.timestamp ?? ''}</span>
        <span>{points[points.length - 1]?.timestamp ?? ''}</span>
      </div>
    </div>
  );
}

function HourlyHeatmap({ hours }: { hours: HourlyHeatmapPoint[] }) {
  if (hours.length === 0) return <div style={MUTED}>No hourly data yet</div>;
  const maxTokens = Math.max(...hours.map(h => h.tokens), 1);

  const colorFor = (tokens: number) => {
    const ratio = tokens / maxTokens;
    if (ratio < 0.33) return C.green;
    if (ratio < 0.66) return C.yellow;
    return C.red;
  };

  return (
    <div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>HOURLY TOKEN VOLUME</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 60 }}>
        {hours.map((h, i) => {
          const barH = Math.max((h.tokens / maxTokens) * 100, 2);
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${barH}%`,
                borderRadius: '2px 2px 0 0',
                background: colorFor(h.tokens),
                transition: 'height 0.4s ease',
              }}
              title={`${h.hour}:00 — ${(h.tokens / 1000).toFixed(1)}k tokens`}
            />
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: C.muted, marginTop: 4 }}>
        <span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>24h</span>
      </div>
    </div>
  );
}

function LiveFeed({ entries }: { entries: LiveFeedEntry[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length]);

  const exportCSV = () => {
    const header = 'Timestamp,Agent,Model,Tokens,Cost,Action';
    const rows = entries.map(e =>
      `${e.timestamp},${e.agentName},${e.model},${e.tokens},${e.cost},${e.action}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `token-burn-feed-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (entries.length === 0) return <div style={MUTED}>No live entries yet</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          LIVE FEED ({entries.length} entries)
        </div>
        <button
          onClick={exportCSV}
          style={{
            background: C.accent, color: '#0a0e17', border: 'none',
            borderRadius: 6, padding: '5px 14px', fontSize: 11, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Export CSV
        </button>
      </div>
      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={TH}>Time</th>
              <th style={TH}>Agent</th>
              <th style={TH}>Model</th>
              <th style={{ ...TH, textAlign: 'right' }}>Tokens</th>
              <th style={{ ...TH, textAlign: 'right' }}>Cost</th>
              <th style={TH}>Action</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={e.id || i}>
                <td style={{ ...TD, color: C.muted, fontSize: 11 }}>{e.timestamp}</td>
                <td style={TD}>{e.agentName}</td>
                <td style={{ ...TD, color: C.muted }}>{e.model}</td>
                <td style={{ ...TD, textAlign: 'right' }}>{(e.tokens / 1000).toFixed(1)}k</td>
                <td style={{ ...TD, textAlign: 'right', color: C.red }}>${e.cost.toFixed(4)}</td>
                <td style={{ ...TD, fontSize: 12, color: C.muted }}>{e.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

/* ── main component ──────────────────────────────────────── */

export default function TokenIntel() {
  const [range, setRange] = useState<'today' | 'week' | 'month'>('today');
  const burn = usePolling<TokenBurnData>(`/api/token-burn?range=${range}`, 10_000);

  /* loading state — all polls still loading */
  if (burn.loading) {
    return (
      <div>
        <TimeRangeSelector value={range} onChange={setRange} />
        <div style={CENTER}>Loading…</div>
      </div>
    );
  }

  if (burn.error) {
    return (
      <div>
        <TimeRangeSelector value={range} onChange={setRange} />
        <div style={{ color: C.red, fontSize: 13, padding: 20, textAlign: 'center' }}>
          {burn.error}
        </div>
      </div>
    );
  }

  const d = burn.data;
  if (!d) {
    return (
      <div>
        <TimeRangeSelector value={range} onChange={setRange} />
        <div style={MUTED}>No data yet</div>
      </div>
    );
  }

  const s = d.summary;
  const totalK = (s.totalTokens / 1000).toFixed(1);

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* ── Time Range Selector ──────────────────────────── */}
      <TimeRangeSelector value={range} onChange={setRange} />

      {/* ── KPI Row ──────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        <KpiCard
          label="Total Tokens"
          value={`${totalK}k`}
          sub={`${s.totalCalls} calls`}
          delta={{ value: s.totalTokens > 0 ? 'active' : '', better: true }}
        />
        <KpiCard
          label="TOON Savings"
          value={`$${s.toonSavedDollars.toFixed(2)}`}
          sub={`${s.savedPercent.toFixed(1)}% savings rate`}
          delta={{ value: `${s.savedPercent.toFixed(1)}%`, better: s.savedPercent > 0 }}
        />
        <KpiCard
          label="Net Cost"
          value={`$${s.netCostDollars.toFixed(2)}`}
          sub="spent − saved"
        />
        <KpiCard
          label="API Calls"
          value={`${s.totalCalls}`}
          sub={`${range} range`}
        />
      </div>

      {/* ── Budget Gauge ─────────────────────────────────── */}
      {d.budget && <BudgetGauge budget={d.budget} />}

      {/* ── Agent Burn + Model Mix ───────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: 20,
        marginBottom: 20,
      }}>
        <div style={CARD}>
          <h3 style={SECTION_TITLE}>🔥 Agent Burn</h3>
          {d.agentBurn ? (
            <AgentBurnTable agents={d.agentBurn} />
          ) : (
            <div style={MUTED}>No agent burn data yet</div>
          )}
        </div>

        <div style={CARD}>
          <h3 style={SECTION_TITLE}>🧠 Model Mix</h3>
          {d.modelMix ? (
            <ModelMixTable models={d.modelMix} />
          ) : (
            <div style={MUTED}>No model mix data yet</div>
          )}
        </div>
      </div>

      {/* ── Burn Timeline + Hourly Heatmap ───────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: 20,
        marginBottom: 20,
      }}>
        <div style={CARD}>
          <h3 style={SECTION_TITLE}>📈 Burn Timeline</h3>
          {d.burnTimeline ? (
            <BurnTimeline points={d.burnTimeline} />
          ) : (
            <div style={MUTED}>No timeline data yet</div>
          )}
        </div>

        <div style={CARD}>
          <h3 style={SECTION_TITLE}>⏱ Hourly Heatmap</h3>
          {d.hourlyHeatmap ? (
            <HourlyHeatmap hours={d.hourlyHeatmap} />
          ) : (
            <div style={MUTED}>No hourly data yet</div>
          )}
        </div>
      </div>

      {/* ── Live Feed ────────────────────────────────────── */}
      <div style={CARD}>
        <h3 style={SECTION_TITLE}>📡 Live Feed</h3>
        {d.liveFeed ? (
          <LiveFeed entries={d.liveFeed} />
        ) : (
          <div style={MUTED}>No live entries yet</div>
        )}
      </div>
    </div>
  );
}
