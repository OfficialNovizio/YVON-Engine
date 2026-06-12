import React from 'react';

interface Anomaly {
  type: string;
  agent?: string;
  detail: string;
  severity: 'red' | 'yellow';
  action: string;
}
interface AnomalyFeedProps { anomalies: Anomaly[]; }

const sevColors = { red: '#ef4444', yellow: '#f59e0b' };

export const AnomalyFeed: React.FC<AnomalyFeedProps> = ({ anomalies }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
    {anomalies.map((a, i) => (
      <div key={i} style={{
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        borderLeft: `3px solid ${sevColors[a.severity]}`, borderRadius: 10, padding: 14,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: '#e4e8f0' }}>
            {a.type}{a.agent ? ` · ${a.agent}` : ''}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            color: sevColors[a.severity], background: `${sevColors[a.severity]}18`,
            borderRadius: 4, padding: '2px 8px',
          }}>{a.severity}</span>
        </div>
        <div style={{ fontSize: 12, color: '#5a6478', marginBottom: 8 }}>{a.detail}</div>
        <button style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 6, color: '#e4e8f0', fontSize: 12, padding: '5px 14px', cursor: 'pointer',
        }}>{a.action}</button>
      </div>
    ))}
  </div>
);
