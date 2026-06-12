import React from 'react';
import { usePolling } from '../hooks/usePolling';
import { KPICard } from '../components/KPICard';
import { AnomalyFeed } from '../components/AnomalyFeed';
import { GradedBar } from '../components/GradedBar';
import { QueryLog } from '../components/QueryLog';

/* ── helpers ─────────────────────────────────────────────── */
const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 14,
  padding: 20,
  backdropFilter: 'blur(16px)',
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
  textAlign: 'center',
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

/* ── types ───────────────────────────────────────────────── */
interface Stats {
  avgSavingsPercent: number;
  totalCalls: number;
  totalBytesSaved: number;
  totalCostSaved: number;
  byTaskType?: Record<string, { calls: number; saved: number }>;
  savingsTrend?: number[];
}

interface CostData {
  totalSpent: number;
  totalSaved: number;
  netCost: number;
}

interface HealthData {
  status: string;
  uptime?: number;
  version?: string;
}

interface AgentEff {
  agentId: string;
  name: string;
  efficiency: number;
  department: string;
  totalCalls: number;
}

interface Anomaly {
  type: string;
  agent?: string;
  detail: string;
  severity: 'red' | 'yellow';
  action: string;
}

interface QueryItem {
  id: string;
  query: string;
  model: string;
  savings: number;
  timestamp: string;
}

interface AgentsEffData { agents: AgentEff[]; }
interface AnomaliesData { anomalies: Anomaly[]; }
interface QueriesData { queries: QueryItem[]; }

/* ── component ───────────────────────────────────────────── */
export default function Overview() {
  const stats    = usePolling<Stats>('/api/engine/stats?hours=24', 30_000);
  const cost     = usePolling<CostData>('/api/cost?hours=24', 30_000);
  const agents   = usePolling<AgentsEffData>('/api/agents/efficiency?hours=24', 30_000);
  const health   = usePolling<HealthData>('/api/health', 30_000);
  const anomalies= usePolling<AnomaliesData>('/api/engine/anomalies?hours=24', 30_000);
  const queries  = usePolling<QueriesData>('/api/engine/queries?limit=50', 30_000);

  /* ── loading ──────────────────────────────────────────── */
  if (stats.loading && cost.loading && agents.loading && health.loading &&
      anomalies.loading && queries.loading) {
    return <div style={CENTER}>Loading…</div>;
  }

  /* ── KPI values ───────────────────────────────────────── */
  const toonPct  = stats.data?.avgSavingsPercent?.toFixed(1) ?? '—';
  const costToday= cost.data ? `$${cost.data.totalSpent.toFixed(2)}` : '—';
  const activeAgents = agents.data?.agents?.length ?? 0;
  const healthScore  = health.data?.status === 'ok' ? 'Healthy' : 'Degraded';
  const healthColor  = health.data?.status === 'ok' ? '#10b981' : '#ef4444';

  const top5 = (agents.data?.agents || [])
    .sort((a, b) => b.efficiency - a.efficiency)
    .slice(0, 5);

  const recentQueries = (queries.data?.queries || []).slice(0, 8);

  return (
    <div style={{ padding: '0 0 40px 0' }}>
      {/* ── KPI row ─────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        <KPICard
          label="TOON Savings"
          value={`${toonPct}%`}
          sub={`${stats.data?.totalCalls ?? 0} calls`}
          color="#10b981"
          sparkline={stats.data?.savingsTrend}
        />
        <KPICard
          label="Cost Today"
          value={costToday}
          sub={`Net $${cost.data?.netCost?.toFixed(4) ?? '—'}`}
          color="#f59e0b"
          trend={cost.data && cost.data.netCost < 0 ? 'down' : 'up'}
        />
        <KPICard
          label="Active Agents"
          value={`${activeAgents}`}
          sub="online / total"
          color="#8b5cf6"
        />
        <KPICard
          label="Health Score"
          value={healthScore}
          sub={health.data?.version ? `v${health.data.version}` : undefined}
          color={healthColor}
        />
      </div>

      {/* ── Grid: AnomalyFeed + Agent bars ───────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        {/* Anomalies */}
        <div style={CARD}>
          <h3 style={SECTION_TITLE}>⚠️ Anomalies (24h)</h3>
          {anomalies.loading ? (
            <div style={CENTER}>Loading…</div>
          ) : anomalies.error ? (
            <div style={{ color: '#ef4444', fontSize: 13, padding: 20 }}>{anomalies.error}</div>
          ) : (anomalies.data?.anomalies || []).length === 0 ? (
            <div style={MUTED}>No anomalies detected</div>
          ) : (
            <AnomalyFeed anomalies={anomalies.data!.anomalies} />
          )}
        </div>

        {/* Agent efficiency top 5 */}
        <div style={CARD}>
          <h3 style={SECTION_TITLE}>🏆 Top Agent Efficiency</h3>
          {agents.loading ? (
            <div style={CENTER}>Loading…</div>
          ) : agents.error ? (
            <div style={{ color: '#ef4444', fontSize: 13, padding: 20 }}>{agents.error}</div>
          ) : top5.length === 0 ? (
            <div style={MUTED}>No agent data yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {top5.map((a) => (
                <div key={a.agentId}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: 13, marginBottom: 4,
                  }}>
                    <span style={{ color: '#e4e8f0' }}>{a.name}</span>
                    <span style={{ color: '#5a6478' }}>{a.department}</span>
                  </div>
                  <GradedBar
                    value={a.efficiency}
                    max={100}
                    color="#00d4ff"
                    label={`${a.efficiency.toFixed(1)}%`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent queries ───────────────────────────────── */}
      <div style={CARD}>
        <h3 style={SECTION_TITLE}>📋 Recent Queries</h3>
        {queries.loading ? (
          <div style={CENTER}>Loading…</div>
        ) : queries.error ? (
          <div style={{ color: '#ef4444', fontSize: 13, padding: 20 }}>{queries.error}</div>
        ) : recentQueries.length === 0 ? (
          <div style={MUTED}>No queries yet</div>
        ) : (
          <QueryLog queries={recentQueries} maxHeight={360} />
        )}
      </div>
    </div>
  );
}
