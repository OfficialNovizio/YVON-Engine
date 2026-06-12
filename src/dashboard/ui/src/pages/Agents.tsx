import React, { useState } from 'react';
import { usePolling } from '../hooks/usePolling';
import { AgentRow } from '../components/AgentRow';

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

const TAG_STYLE: React.CSSProperties = {
  display: 'inline-block',
  padding: '4px 10px',
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 600,
  marginRight: 6,
  cursor: 'pointer',
};

/* ── types ───────────────────────────────────────────────── */
interface AgentEff {
  agentId: string;
  name: string;
  efficiency: number;
  department: string;
  totalCalls: number;
  avgSavingsPercent: number;
  costSaved: number;
  status?: string;
}

interface LiveAgent {
  agentId: string;
  status: 'online' | 'idle' | 'offline';
  lastActive?: string;
}

interface AgentEffData { agents: AgentEff[]; }
interface LiveData { agents: LiveAgent[]; }

const DEPARTMENTS = ['CEO', 'COO', 'Technical', 'Marketing', 'Finance', 'Psychology'];

const DEPT_COLORS: Record<string, string> = {
  CEO: '#8b5cf6',
  COO: '#00d4ff',
  Technical: '#10b981',
  Marketing: '#f59e0b',
  Finance: '#ef4444',
  Psychology: '#ec4899',
};

/* ── component ───────────────────────────────────────────── */
export default function Agents() {
  const [activeDept, setActiveDept] = useState<string | null>(null);

  const effData  = usePolling<AgentEffData>('/api/agents/efficiency?hours=24', 30_000);
  const liveData = usePolling<LiveData>('/api/live', 30_000);

  if (effData.loading && liveData.loading) {
    return <div style={CENTER}>Loading…</div>;
  }

  /* Merge efficiency + live status */
  const liveMap: Record<string, string> = {};
  (liveData.data?.agents || []).forEach((a) => { liveMap[a.agentId] = a.status; });

  let agents: (AgentEff & { liveStatus: string })[] = (effData.data?.agents || []).map((a) => ({
    ...a,
    liveStatus: liveMap[a.agentId] || a.status || 'offline',
  }));

  /* Filter by department */
  if (activeDept) {
    agents = agents.filter((a) => a.department === activeDept);
  }

  /* Sort: online > idle > offline, then by efficiency */
  const statusOrder: Record<string, number> = { online: 0, idle: 1, offline: 2 };
  agents.sort((a, b) => {
    const so = (statusOrder[a.liveStatus] ?? 3) - (statusOrder[b.liveStatus] ?? 3);
    if (so !== 0) return so;
    return b.efficiency - a.efficiency;
  });

  /* Department counts */
  const deptCounts: Record<string, number> = {};
  (effData.data?.agents || []).forEach((a) => {
    deptCounts[a.department] = (deptCounts[a.department] || 0) + 1;
  });

  const onlineCount = agents.filter((a) => a.liveStatus === 'online').length;
  const totalCount  = agents.length;

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* ── Summary bar ─────────────────────────────────── */}
      <div style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#e4e8f0' }}>{totalCount}</div>
          <div style={{ fontSize: 12, color: '#5a6478' }}>Total Agents</div>
        </div>
        <div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#10b981' }}>{onlineCount}</div>
          <div style={{ fontSize: 12, color: '#5a6478' }}>Online</div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 12, color: '#5a6478' }}>
          {DEPARTMENTS.map((d) => (
            <span key={d} style={{ marginRight: 8 }}>
              <span style={{ color: DEPT_COLORS[d] }}>●</span> {d}: {deptCounts[d] || 0}
            </span>
          ))}
        </div>
      </div>

      {/* ── Department filter chips ─────────────────────── */}
      <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button
          onClick={() => setActiveDept(null)}
          style={{
            ...TAG_STYLE,
            background: activeDept === null ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: activeDept === null ? '#e4e8f0' : '#5a6478',
          }}
        >
          All ({totalCount})
        </button>
        {DEPARTMENTS.map((d) => (
          <button
            key={d}
            onClick={() => setActiveDept(activeDept === d ? null : d)}
            style={{
              ...TAG_STYLE,
              background: activeDept === d ? `${DEPT_COLORS[d]}22` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${activeDept === d ? DEPT_COLORS[d] : 'rgba(255,255,255,0.08)'}`,
              color: activeDept === d ? DEPT_COLORS[d] : '#5a6478',
            }}
          >
            {d} ({deptCounts[d] || 0})
          </button>
        ))}
      </div>

      {/* ── Agent list ──────────────────────────────────── */}
      <div style={CARD}>
        <h3 style={SECTION_TITLE}>
          👥 Agent Roster
          <span style={{ fontSize: 12, color: '#5a6478', fontWeight: 400, marginLeft: 8 }}>
            ({agents.length} agents)
          </span>
        </h3>

        {effData.loading ? (
          <div style={CENTER}>Loading…</div>
        ) : effData.error ? (
          <div style={{ color: '#ef4444', fontSize: 13, padding: 20 }}>{effData.error}</div>
        ) : agents.length === 0 ? (
          <div style={MUTED}>No agents found</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {agents.map((a) => (
              <AgentRow
                key={a.agentId}
                agentId={a.agentId}
                name={a.name}
                department={a.department}
                status={a.liveStatus}
                efficiency={a.efficiency}
                totalCalls={a.totalCalls}
                avgSavingsPercent={a.avgSavingsPercent}
                costSaved={a.costSaved}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Department summary cards ────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12,
      }}>
        {DEPARTMENTS.map((d) => {
          const deptAgents = (effData.data?.agents || []).filter((a) => a.department === d);
          const avgEff = deptAgents.length > 0
            ? deptAgents.reduce((s, a) => s + a.efficiency, 0) / deptAgents.length
            : 0;
          return (
            <div key={d} style={{
              ...CARD, marginBottom: 0, padding: 16, cursor: 'pointer',
              borderColor: activeDept === d ? DEPT_COLORS[d] : 'rgba(255,255,255,0.08)',
            }} onClick={() => setActiveDept(activeDept === d ? null : d)}>
              <div style={{ fontSize: 12, color: DEPT_COLORS[d], fontWeight: 600, marginBottom: 6 }}>
                {d}
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#e4e8f0' }}>
                {deptAgents.length}
              </div>
              <div style={{ fontSize: 11, color: '#5a6478' }}>
                agents · {avgEff.toFixed(0)}% avg eff
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
