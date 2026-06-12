import React from 'react';

interface Query {
  timestamp?: number | string; time?: string; agentId?: string; agent?: string;
  taskType?: string; task?: string;
  originalChars?: number; raw?: number; injectedChars?: number; toon?: number;
  savingsPercent?: number; savings?: number;
  [key: string]: any;
}
interface QueryLogProps { queries: Query[]; maxHeight?: number; }

const savingsColor = (p: number) => p >= 60 ? '#10b981' : p >= 30 ? '#f59e0b' : '#ef4444';

export const QueryLog: React.FC<QueryLogProps> = ({ queries, maxHeight = 400 }) => {
  const fmt = (q: Query) => {
    const ts = q.timestamp ? (typeof q.timestamp === 'string' ? new Date(q.timestamp).getTime() : q.timestamp) : 0
    const agent = q.agentId || q.agent || '—'
    const task = q.taskType || q.task || '—'
    const orig = q.originalChars || q.raw || 0
    const inj = q.injectedChars || q.toon || 0
    const sav = q.savingsPercent ?? q.savings ?? 0
    return { ts, agent, task, orig, inj, sav }
  }

  return (
    <div style={{ maxHeight, overflowY: 'auto', borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.08)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: 'rgba(255,255,255,0.04)', position: 'sticky', top: 0 }}>
            {['Time', 'Agent', 'Task', 'Raw→Toon', 'Saved'].map(h => (
              <th key={h} style={{ padding: '10px 14px', color: '#5a6478', fontWeight: 600,
                textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {queries.map((q, i) => {
            const r = fmt(q)
            return (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '8px 14px', color: '#5a6478', whiteSpace: 'nowrap' }}>
                  {r.ts ? new Date(r.ts).toLocaleTimeString() : q.time || '—'}
                </td>
                <td style={{ padding: '8px 14px', color: '#e4e8f0' }}>{r.agent}</td>
                <td style={{ padding: '8px 14px', color: '#e4e8f0' }}>{r.task}</td>
                <td style={{ padding: '8px 14px', color: '#5a6478' }}>
                  {r.orig.toLocaleString()} → {r.inj.toLocaleString()}
                </td>
                <td style={{ padding: '8px 14px', fontWeight: 700, color: savingsColor(r.sav) }}>
                  {r.sav}%
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
};
