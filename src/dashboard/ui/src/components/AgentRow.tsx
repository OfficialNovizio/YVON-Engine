import React, { useState } from 'react';

interface AgentData {
  agentId: string; name: string; department: string; queries: number;
  avgSavings: number; costEstimate: number; efficiencyGrade: string;
  totalTokens: number; avgLatencyMs: number; taskTypes?: Record<string, number>;
}
interface AgentRowProps {
  agent?: AgentData;
  // Also accept flat props (from pages that spread agent data)
  agentId?: string; name?: string; department?: string; queries?: number;
  avgSavings?: number; costEstimate?: number; efficiencyGrade?: string;
  totalTokens?: number; avgLatencyMs?: number; taskTypes?: Record<string, number>;
  status?: string; totalCalls?: number; costSaved?: number; efficiency?: number;
  avgSavingsPercent?: number;
}

const gradeColors: Record<string, string> = { 'A+': '#10b981', A: '#10b981', B: '#f59e0b',
  C: '#f59e0b', D: '#ef4444', F: '#ef4444' };

export const AgentRow: React.FC<AgentRowProps> = (props) => {
  const [open, setOpen] = useState(false);
  // Resolve agent from either { agent } object or flat props
  const a = props.agent || {
    agentId: props.agentId || '',
    name: props.name || props.agentId || 'Unknown',
    department: props.department || '',
    queries: props.queries || props.totalCalls || 0,
    avgSavings: props.avgSavings || props.avgSavingsPercent || props.efficiency || 0,
    costEstimate: props.costEstimate || props.costSaved || 0,
    efficiencyGrade: props.efficiencyGrade || (props.avgSavingsPercent && props.avgSavingsPercent >= 95 ? 'A+' : props.avgSavingsPercent && props.avgSavingsPercent >= 90 ? 'A' : 'B'),
    totalTokens: props.totalTokens || 0,
    avgLatencyMs: props.avgLatencyMs || 0,
  };
  const grade = a.efficiencyGrade || 'B';
  const bg = gradeColors[grade] || '#5a6478';

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12, overflow: 'hidden',
    }}>
      <div onClick={() => setOpen(!open)} style={{
        display: 'flex', alignItems: 'center', padding: '14px 18px', cursor: 'pointer',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 600, color: '#e4e8f0' }}>{a.name}</span>
          <span style={{ fontSize: 12, color: '#5a6478' }}>{a.department}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: '#e4e8f0' }}>{a.queries} q</span>
          <span style={{ fontSize: 13, color: '#5a6478' }}>{a.avgSavings}% saved</span>
          <span style={{
            fontSize: 11, fontWeight: 700, color: '#0a0e17', background: bg,
            borderRadius: 4, padding: '2px 8px',
          }}>{grade}</span>
          <span style={{ color: '#5a6478', transform: open ? 'rotate(90deg)' : 'none' }}>▶</span>
        </div>
      </div>
      {open && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '14px 18px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <Metric label="Total Tokens" value={a.totalTokens.toLocaleString()} />
          <Metric label="Avg Latency" value={`${a.avgLatencyMs} ms`} />
          <Metric label="Cost Est." value={`$${a.costEstimate.toFixed(2)}`} />
          {a.taskTypes && Object.entries(a.taskTypes).map(([t, c]) => (
            <Metric key={t} label={t} value={String(c)} />
          ))}
        </div>
      )}
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ minWidth: 100 }}>
    <div style={{ fontSize: 11, color: '#5a6478' }}>{label}</div>
    <div style={{ fontSize: 15, fontWeight: 600, color: '#e4e8f0' }}>{value}</div>
  </div>
);
