import React from 'react';

interface GlassTabsProps { tabs: string[]; active: string; onSelect: (tab: string) => void; }

export const GlassTabs: React.FC<GlassTabsProps> = ({ tabs, active, onSelect }) => (
  <div style={{
    display: 'inline-flex', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 4, gap: 2,
  }}>
    {tabs.map(tab => {
      const isActive = tab === active;
      return (
        <button key={tab} onClick={() => onSelect(tab)} style={{
          background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
          border: isActive ? '1px solid rgba(0,212,255,0.3)' : '1px solid transparent',
          borderRadius: 10, color: isActive ? '#00d4ff' : '#5a6478',
          fontSize: 13, fontWeight: isActive ? 600 : 400, padding: '8px 18px',
          cursor: 'pointer', transition: 'all 0.2s',
        }}>{tab}</button>
      );
    })}
  </div>
);
