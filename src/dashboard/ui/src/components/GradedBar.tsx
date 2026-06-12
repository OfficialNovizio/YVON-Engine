import React from 'react';

interface GradedBarProps { label: string; value: number; max: number; grade?: string; color?: string; type?: string; }

const gradeColors: Record<string, string> = { 'A+': '#10b981', A: '#10b981', B: '#f59e0b',
  C: '#f59e0b', D: '#ef4444', F: '#ef4444' };

export const GradedBar: React.FC<GradedBarProps> = ({ label, value, max, grade, color, type }) => {
  const pct = Math.min((value / max) * 100, 100);
  const fill = color || gradeColors[grade || ''] || '#5a6478';

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: '#5a6478' }}>
          {label}{type ? ` · ${type}` : ''}
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#e4e8f0' }}>{pct.toFixed(0)}%</span>
      </div>
      <div style={{
        background: 'rgba(255,255,255,0.06)', borderRadius: 6, height: 10, overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`, height: '100%', background: fill, borderRadius: 6,
          transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  );
};
