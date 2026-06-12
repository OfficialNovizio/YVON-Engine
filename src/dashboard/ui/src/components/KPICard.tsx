import React from 'react';
import { Sparkline } from './Sparkline';

interface KPICardProps {
  label: string;
  value: string;
  sub?: string;
  trend?: 'up' | 'down' | 'flat';
  sparkline?: number[];
  color?: string;
}

const trendArrows: Record<string, string> = { up: '▲', down: '▼', flat: '→' };
const trendColors: Record<string, string> = { up: '#10b981', down: '#ef4444', flat: '#5a6478' };

export const KPICard: React.FC<KPICardProps> = ({ label, value, sub, trend, sparkline, color }) => (
  <div style={{
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14, padding: 20, minWidth: 180,
  }}>
    <div style={{ fontSize: 12, color: '#5a6478', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
      {label}
    </div>
    <div style={{ fontSize: 28, fontWeight: 700, color: color || '#e4e8f0', lineHeight: 1.1 }}>
      {value}
      {trend && (
        <span style={{ fontSize: 16, color: trendColors[trend], marginLeft: 8, verticalAlign: 'middle' }}>
          {trendArrows[trend]}
        </span>
      )}
    </div>
    {sub && <div style={{ fontSize: 13, color: '#5a6478', marginTop: 4 }}>{sub}</div>}
    {sparkline && sparkline.length > 0 && (
      <div style={{ marginTop: 12 }}>
        <Sparkline data={sparkline} width={160} height={36} color={color || '#00d4ff'} />
      </div>
    )}
  </div>
);
