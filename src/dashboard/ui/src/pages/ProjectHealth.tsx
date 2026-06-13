import React, { useState } from 'react';
import { usePolling } from '../hooks/usePolling';
import { Sparkline } from '../components/Sparkline';
import { GradedBar } from '../components/GradedBar';

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

/* ── grade helpers ───────────────────────────────────────── */
const gradeColor = (g: string): string => {
  if (!g) return C.muted;
  if (g.startsWith('A+')) return '#10b981';
  if (g.startsWith('A')) return '#00d4ff';
  if (g.startsWith('B')) return '#f59e0b';
  return '#ef4444';
};

const severityColor = (s: string): string => {
  if (s === 'critical' || s === 'red') return C.red;
  if (s === 'warning' || s === 'yellow') return C.yellow;
  return C.green;
};

const severityIcon = (s: string): string => {
  if (s === 'critical') return '🔴';
  if (s === 'warning') return '⚠️';
  return '🟢';
};

/* ── types ───────────────────────────────────────────────── */
interface ToonHealth {
  avgSavingsPercent: number;
  grade: string;
  totalContent: number;
}

interface BundleHealth {
  pages: number;
  buildStatus: string;
  lastBuildTime: string;
}

interface ApiHealth {
  successRate: number;
  statusBadges: string[];
}

interface IssuesSummary {
  warningCount: number;
  criticalCount: number;
}

interface ToonQualityItem {
  contentType: string;
  savingsPercent: number;
  grade: string;
}

interface MatchQuality {
  chunksMatched: number;
  chunksInjected: number;
  avgQuality: number;
  l1: number;
  l2: number;
  ref: number;
}

interface CodebaseStructure {
  lastCompileTime: string;
  files: number;
  chunks: number;
  terms: number;
  bpe: number;
  corpusSize: number;
  compressedSize: number;
  deltaFiles: number;
  deltaChunks: number;
  tscErrors: number;
}

interface ApiRoute {
  route: string;
  calls: number;
  successRate: number;
  errors: number;
}

interface PromptQuality {
  avgContextSize: number;
  avgInjectedSize: number;
  reductionPercent: number;
  cacheRate: number;
  bestAgent: string;
  worstAgent: string;
}

interface IssueEntry {
  id: string;
  timestamp: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

interface DocCoverageItem {
  path: string;
  documented: number;
  total: number;
  percent: number;
}

interface ProjectHealthData {
  toonHealth: ToonHealth;
  bundleHealth: BundleHealth;
  apiHealth: ApiHealth;
  issues: IssuesSummary;
  toonQuality: ToonQualityItem[];
  savingsTrend: number[];
  matchQuality: MatchQuality;
  codebaseStructure: CodebaseStructure;
  apiRouteHealth: ApiRoute[];
  promptQuality: PromptQuality;
  issuesFeed: IssueEntry[];
  docCoverage: DocCoverageItem[];
}

/* ── sub-components ──────────────────────────────────────── */

function TimeRangeSelector({ value, onChange }: {
  value: string; onChange: (v: '24h' | '7d' | '30d') => void;
}) {
  const opts: { key: '24h' | '7d' | '30d'; label: string }[] = [
    { key: '24h', label: '24h' },
    { key: '7d', label: '7d' },
    { key: '30d', label: '30d' },
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

function StatCard({ label, value, sub, color }: {
  label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div style={{ ...CARD, marginBottom: 0, minWidth: 160 }}>
      <div style={{ fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: color || C.text, lineHeight: 1.1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  const gc = gradeColor(grade);
  return (
    <span style={{
      fontSize: 13, fontWeight: 700, padding: '2px 10px', borderRadius: 6,
      background: gc + '22',
      color: gc,
      border: `1px solid ${gc}44`,
    }}>
      {grade}
    </span>
  );
}

function ToonQualityBars({ items }: { items: ToonQualityItem[] }) {
  if (items.length === 0) return <div style={MUTED}>No quality data yet</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {items.map((tq, i) => (
        <div key={i}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontSize: 13, marginBottom: 4,
          }}>
            <span style={{ color: C.text, fontWeight: 500 }}>{tq.contentType}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 600, color: gradeColor(tq.grade) }}>
                {tq.savingsPercent.toFixed(1)}%
              </span>
              <GradeBadge grade={tq.grade} />
            </span>
          </div>
          <GradedBar
            value={tq.savingsPercent}
            max={100}
            color={gradeColor(tq.grade)}
            label=""
          />
        </div>
      ))}
    </div>
  );
}

function MatchQualityCard({ mq }: { mq: MatchQuality }) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.accent }}>
            {mq.chunksMatched.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Chunks Matched</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.green }}>
            {mq.chunksInjected.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Chunks Injected</div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>AVERAGE QUALITY: {mq.avgQuality.toFixed(1)}%</div>
      <div style={{ display: 'flex', gap: 8 }}>
        {['L1', 'L2', 'REF'].map((tier) => {
          let val: number;
          if (tier === 'L1') val = mq.l1;
          else if (tier === 'L2') val = mq.l2;
          else val = mq.ref;
          const pct = mq.chunksMatched > 0 ? (val / mq.chunksMatched) * 100 : 0;
          const color = tier === 'L1' ? C.green : tier === 'L2' ? C.yellow : C.purple;
          return (
            <div key={tier} style={{
              flex: 1, padding: '8px 12px', borderRadius: 8,
              background: 'rgba(255,255,255,0.025)',
              border: `1px solid ${C.glassBorder}`,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 16, fontWeight: 700, color }}>{val}</div>
              <div style={{ fontSize: 10, color: C.muted }}>{tier} ({pct.toFixed(0)}%)</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CodebaseView({ cs }: { cs: CodebaseStructure }) {
  const compressionRatio = cs.corpusSize > 0
    ? ((cs.corpusSize - cs.compressedSize) / cs.corpusSize * 100).toFixed(1)
    : '0';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
      <div style={{ textAlign: 'center', padding: 8 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.accent }}>{cs.files.toLocaleString()}</div>
        <div style={{ fontSize: 11, color: C.muted }}>Files</div>
      </div>
      <div style={{ textAlign: 'center', padding: 8 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.purple }}>{cs.chunks.toLocaleString()}</div>
        <div style={{ fontSize: 11, color: C.muted }}>Chunks</div>
      </div>
      <div style={{ textAlign: 'center', padding: 8 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{cs.terms.toLocaleString()}</div>
        <div style={{ fontSize: 11, color: C.muted }}>Terms</div>
      </div>
      <div style={{ textAlign: 'center', padding: 8 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.accent }}>{cs.bpe.toLocaleString()}</div>
        <div style={{ fontSize: 11, color: C.muted }}>BPE Tokens</div>
      </div>
      <div style={{ textAlign: 'center', padding: 8 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.yellow }}>
          {(cs.corpusSize / 1024).toFixed(0)}KB
        </div>
        <div style={{ fontSize: 11, color: C.muted }}>Corpus</div>
      </div>
      <div style={{ textAlign: 'center', padding: 8 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.green }}>
          {(cs.compressedSize / 1024).toFixed(0)}KB
        </div>
        <div style={{ fontSize: 11, color: C.muted }}>Compressed ({compressionRatio}%)</div>
      </div>
      <div style={{ textAlign: 'center', padding: 8 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: cs.tscErrors > 0 ? C.red : C.green }}>
          {cs.tscErrors}
        </div>
        <div style={{ fontSize: 11, color: C.muted }}>TSC Errors</div>
      </div>
      <div style={{ textAlign: 'center', padding: 8 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.accent }}>
          +{cs.deltaFiles} files
        </div>
        <div style={{ fontSize: 11, color: C.muted }}>Delta ({cs.deltaChunks} chunks)</div>
      </div>
    </div>
  );
}

function ApiRouteHealthTable({ routes }: { routes: ApiRoute[] }) {
  if (routes.length === 0) return <div style={MUTED}>No route data yet</div>;

  const sorted = [...routes].sort((a, b) => b.errors - a.errors);

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={TH}>Route</th>
          <th style={{ ...TH, textAlign: 'right' }}>Calls</th>
          <th style={{ ...TH, textAlign: 'right' }}>Success</th>
          <th style={{ ...TH, textAlign: 'right' }}>Errors</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((r, i) => (
          <tr key={i}>
            <td style={{ ...TD, fontFamily: 'monospace', fontSize: 12 }}>{r.route}</td>
            <td style={{ ...TD, textAlign: 'right' }}>{r.calls}</td>
            <td style={{
              ...TD, textAlign: 'right',
              color: r.successRate >= 95 ? C.green : r.successRate >= 80 ? C.yellow : C.red,
              fontWeight: 600,
            }}>
              {r.successRate.toFixed(1)}%
            </td>
            <td style={{
              ...TD, textAlign: 'right',
              color: r.errors > 0 ? C.red : C.muted,
              fontWeight: r.errors > 0 ? 600 : 400,
            }}>
              {r.errors}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PromptQualityCard({ pq }: { pq: PromptQuality }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div style={{ textAlign: 'center', padding: 12, background: 'rgba(255,255,255,0.025)', borderRadius: 8 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.accent }}>
          {(pq.avgContextSize / 1024).toFixed(1)}KB
        </div>
        <div style={{ fontSize: 11, color: C.muted }}>Avg Context</div>
      </div>
      <div style={{ textAlign: 'center', padding: 12, background: 'rgba(255,255,255,0.025)', borderRadius: 8 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.green }}>
          {(pq.avgInjectedSize / 1024).toFixed(1)}KB
        </div>
        <div style={{ fontSize: 11, color: C.muted }}>Avg Injected</div>
      </div>
      <div style={{ textAlign: 'center', padding: 12, background: 'rgba(255,255,255,0.025)', borderRadius: 8 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.purple }}>
          {pq.reductionPercent.toFixed(1)}%
        </div>
        <div style={{ fontSize: 11, color: C.muted }}>Reduction</div>
      </div>
      <div style={{ textAlign: 'center', padding: 12, background: 'rgba(255,255,255,0.025)', borderRadius: 8 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.yellow }}>
          {pq.cacheRate.toFixed(1)}%
        </div>
        <div style={{ fontSize: 11, color: C.muted }}>Cache Hit Rate</div>
      </div>
      <div style={{ gridColumn: '1 / -1', fontSize: 12, color: C.muted, marginTop: 4 }}>
        <span style={{ color: C.green }}>Best: {pq.bestAgent}</span>
        {' · '}
        <span style={{ color: C.red }}>Worst: {pq.worstAgent}</span>
      </div>
    </div>
  );
}

function IssuesFeed({ issues }: { issues: IssueEntry[] }) {
  if (issues.length === 0) return <div style={MUTED}>No issues — all clear ✅</div>;

  const sorted = [...issues].sort((a, b) => {
    const sev = { critical: 0, warning: 1, info: 2 };
    return (sev[a.severity] ?? 3) - (sev[b.severity] ?? 3);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
      {sorted.map((iss, i) => {
        const sc = severityColor(iss.severity);
        return (
          <div
            key={iss.id || i}
            style={{
              padding: '10px 14px',
              background: 'rgba(255,255,255,0.025)',
              borderRadius: 10,
              borderLeft: `3px solid ${sc}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                {severityIcon(iss.severity)} {iss.message}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const,
                color: sc, padding: '1px 8px', borderRadius: 4,
                background: sc + '22',
              }}>
                {iss.severity}
              </span>
            </div>
            <div style={{ fontSize: 11, color: C.muted }}>{iss.timestamp}</div>
          </div>
        );
      })}
    </div>
  );
}

function DocCoverageGrid({ items }: { items: DocCoverageItem[] }) {
  if (items.length === 0) return <div style={MUTED}>No doc coverage data yet</div>;

  const maxTotal = Math.max(...items.map(d => d.total), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((d, i) => {
        const pctColor = d.percent >= 80 ? C.green : d.percent >= 50 ? C.yellow : C.red;
        return (
          <div
            key={i}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px',
              background: 'rgba(255,255,255,0.025)',
              borderRadius: 10,
              border: `1px solid ${C.glassBorder}`,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 500, fontFamily: 'monospace', flex: 1 }}>
              {d.path}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 90, height: 6, borderRadius: 3,
                background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
              }}>
                <div style={{
                  width: `${(d.total / maxTotal) * 100}%`, height: '100%', borderRadius: 3,
                  background: C.accent, transition: 'width 0.4s ease',
                }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: pctColor, minWidth: 40, textAlign: 'right' }}>
                {d.percent}%
              </span>
              <span style={{ fontSize: 11, color: C.muted, minWidth: 80, textAlign: 'right' }}>
                {d.documented}/{d.total} docs
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── main component ──────────────────────────────────────── */

export default function ProjectHealth() {
  const [range, setRange] = useState<'24h' | '7d' | '30d'>('24h');
  const health = usePolling<ProjectHealthData>(
    `/api/project-health?range=${range}`,
    30_000,
  );

  /* loading state */
  if (health.loading) {
    return (
      <div>
        <TimeRangeSelector value={range} onChange={setRange} />
        <div style={CENTER}>Loading…</div>
      </div>
    );
  }

  if (health.error) {
    return (
      <div>
        <TimeRangeSelector value={range} onChange={setRange} />
        <div style={{ color: C.red, fontSize: 13, padding: 20, textAlign: 'center' }}>
          {health.error}
        </div>
      </div>
    );
  }

  const d = health.data;
  if (!d) {
    return (
      <div>
        <TimeRangeSelector value={range} onChange={setRange} />
        <div style={MUTED}>No data yet</div>
      </div>
    );
  }

  const th = d.toonHealth;
  const bh = d.bundleHealth;
  const ah = d.apiHealth;
  const iss = d.issues;

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
        <StatCard
          label="TOON Health"
          value={`${th.avgSavingsPercent.toFixed(1)}%`}
          sub={`${th.totalContent} content · Grade ${th.grade}`}
          color={gradeColor(th.grade)}
        />
        <StatCard
          label="Bundle Health"
          value={bh.buildStatus}
          sub={`${bh.pages} pages · ${bh.lastBuildTime}`}
          color={bh.buildStatus === 'OK' || bh.buildStatus === 'ok' ? C.green : C.yellow}
        />
        <StatCard
          label="API Health"
          value={`${ah.successRate.toFixed(1)}%`}
          sub={ah.statusBadges?.join(' · ') || ''}
          color={ah.successRate >= 95 ? C.green : ah.successRate >= 80 ? C.yellow : C.red}
        />
        <StatCard
          label="Issues"
          value={`${iss.warningCount + iss.criticalCount}`}
          sub={`${iss.warningCount} warnings · ${iss.criticalCount} critical`}
          color={iss.criticalCount > 0 ? C.red : iss.warningCount > 0 ? C.yellow : C.green}
        />
      </div>

      {/* ── Toon Quality Bars ────────────────────────────── */}
      <div style={CARD}>
        <h3 style={SECTION_TITLE}>📊 TOON Quality by Content Type</h3>
        {d.toonQuality ? (
          <ToonQualityBars items={d.toonQuality} />
        ) : (
          <div style={MUTED}>No quality data yet</div>
        )}
      </div>

      {/* ── Savings Trend + Match Quality ────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: 20,
        marginBottom: 20,
      }}>
        <div style={CARD}>
          <h3 style={SECTION_TITLE}>📈 Savings Trend</h3>
          {d.savingsTrend && d.savingsTrend.length > 1 ? (
            <Sparkline data={d.savingsTrend} width={600} height={48} color={C.accent} />
          ) : (
            <div style={MUTED}>No trend data yet</div>
          )}
        </div>

        <div style={CARD}>
          <h3 style={SECTION_TITLE}>🔍 Top-K Match Quality</h3>
          {d.matchQuality ? (
            <MatchQualityCard mq={d.matchQuality} />
          ) : (
            <div style={MUTED}>No match quality data yet</div>
          )}
        </div>
      </div>

      {/* ── Codebase Structure ────────────────────────────── */}
      <div style={CARD}>
        <h3 style={SECTION_TITLE}>🏗 Codebase Structure</h3>
        {d.codebaseStructure ? (
          <div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>
              Last compile: {d.codebaseStructure.lastCompileTime}
              {' · '}
              Delta: +{d.codebaseStructure.deltaFiles} files · +{d.codebaseStructure.deltaChunks} chunks
            </div>
            <CodebaseView cs={d.codebaseStructure} />
          </div>
        ) : (
          <div style={MUTED}>No codebase data yet</div>
        )}
      </div>

      {/* ── API Route Health + Prompt Quality ─────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: 20,
        marginBottom: 20,
      }}>
        <div style={CARD}>
          <h3 style={SECTION_TITLE}>🌐 API Route Health</h3>
          {d.apiRouteHealth ? (
            <ApiRouteHealthTable routes={d.apiRouteHealth} />
          ) : (
            <div style={MUTED}>No route data yet</div>
          )}
        </div>

        <div style={CARD}>
          <h3 style={SECTION_TITLE}>📝 Prompt Quality</h3>
          {d.promptQuality ? (
            <PromptQualityCard pq={d.promptQuality} />
          ) : (
            <div style={MUTED}>No prompt quality data yet</div>
          )}
        </div>
      </div>

      {/* ── Issues Feed ───────────────────────────────────── */}
      <div style={CARD}>
        <h3 style={SECTION_TITLE}>⚠️ Issues Feed</h3>
        {d.issuesFeed ? (
          <IssuesFeed issues={d.issuesFeed} />
        ) : (
          <div style={MUTED}>No issues data yet</div>
        )}
      </div>

      {/* ── Doc Coverage ──────────────────────────────────── */}
      <div style={CARD}>
        <h3 style={SECTION_TITLE}>📚 Documentation Coverage</h3>
        {d.docCoverage ? (
          <DocCoverageGrid items={d.docCoverage} />
        ) : (
          <div style={MUTED}>No doc coverage data yet</div>
        )}
      </div>
    </div>
  );
}
