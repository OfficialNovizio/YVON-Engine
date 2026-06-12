import React, { useState } from 'react';
import { usePolling } from '../hooks/usePolling';

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

/* ── types ───────────────────────────────────────────────── */
interface ModuleItem {
  name: string;
  status: string;
  connected: boolean;
  details?: string;
  version?: string;
  coveragePercent?: number;
}

interface ModulesData { modules: ModuleItem[]; }

interface CompileItem {
  id: string;
  timestamp: string;
  corpusSize: number;
  totalTokens: number;
  modulesCount: number;
  queriesProcessed: number;
}

interface CompilesData { compiles: CompileItem[]; }

interface ConfigData {
  version?: string;
  port?: number;
  logLevel?: string;
  maxTokens?: number;
  environment?: string;
  [key: string]: any;
}

/* ── component ───────────────────────────────────────────── */
export default function System() {
  const modulesData  = usePolling<ModulesData>('/api/modules', 30_000);
  const compilesData = usePolling<CompilesData>('/api/compiles?limit=20', 30_000);
  const configData   = usePolling<ConfigData>('/api/config', 30_000);

  const [rechecking, setRechecking] = useState(false);
  const [recheckMsg, setRecheckMsg] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState('');

  if (modulesData.loading && compilesData.loading && configData.loading) {
    return <div style={CENTER}>Loading…</div>;
  }

  const modules   = modulesData.data?.modules || [];
  const latest    = compilesData.data?.compiles?.[0];
  const config    = configData.data;
  const connectedCount = modules.filter((m) => m.connected).length;

  /* Action handlers */
  const handleRecheck = async () => {
    setRechecking(true);
    setRecheckMsg('');
    try {
      const res = await fetch('/api/modules/recheck', { method: 'POST' });
      if (res.ok) {
        setRecheckMsg('✅ Modules rechecked successfully');
      } else {
        setRecheckMsg('❌ Recheck failed');
      }
    } catch {
      setRecheckMsg('❌ Network error');
    } finally {
      setRechecking(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshMsg('');
    try {
      /* Re-fetch modules and compiles to refresh views */
      const modRes = await fetch('/api/modules');
      const compRes = await fetch('/api/compiles?limit=20');
      if (modRes.ok && compRes.ok) {
        setRefreshMsg('✅ Views refreshed');
      } else {
        setRefreshMsg('❌ Refresh failed');
      }
    } catch {
      setRefreshMsg('❌ Network error');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* ── Module status cards ─────────────────────────── */}
      <div style={CARD}>
        <h3 style={SECTION_TITLE}>
          🔌 Module Status
          <span style={{ fontSize: 12, color: '#5a6478', fontWeight: 400, marginLeft: 8 }}>
            {connectedCount}/{modules.length} connected
          </span>
        </h3>

        {modulesData.loading ? (
          <div style={CENTER}>Loading…</div>
        ) : modulesData.error ? (
          <div style={{ color: '#ef4444', fontSize: 13, padding: 20 }}>{modulesData.error}</div>
        ) : modules.length === 0 ? (
          <div style={MUTED}>No modules registered</div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 12,
          }}>
            {modules.map((m, i) => (
              <div key={i} style={{
                padding: '14px 16px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${m.connected
                  ? 'rgba(16, 185, 129, 0.2)'
                  : m.details?.includes('fallback')
                    ? 'rgba(245, 158, 11, 0.2)'
                    : 'rgba(239, 68, 68, 0.2)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: m.connected
                      ? '#10b981'
                      : m.details?.includes('fallback') ? '#f59e0b' : '#ef4444',
                  }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#e4e8f0', flex: 1 }}>
                    {m.name}
                  </span>
                  {m.version && (
                    <span style={{ fontSize: 10, color: '#5a6478' }}>v{m.version}</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: '#5a6478', lineHeight: 1.4 }}>
                  {m.details || m.status}
                </div>
                {m.coveragePercent !== undefined && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      fontSize: 10, color: '#5a6478', marginBottom: 3,
                    }}>
                      <span>Coverage</span>
                      <span style={{
                        fontWeight: 700,
                        color: m.coveragePercent >= 80 ? '#10b981'
                             : m.coveragePercent >= 50 ? '#f59e0b' : '#ef4444',
                      }}>{m.coveragePercent}%</span>
                    </div>
                    <div style={{
                      width: '100%', height: 4, borderRadius: 2,
                      background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
                    }}>
                      <div style={{
                        width: `${m.coveragePercent}%`, height: '100%', borderRadius: 2,
                        background: m.coveragePercent >= 80 ? '#10b981'
                                  : m.coveragePercent >= 50 ? '#f59e0b' : '#ef4444',
                      }} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Storage info ────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 12,
        marginBottom: 20,
      }}>
        {[
          { label: 'Corpus Size', value: latest ? `${(latest.corpusSize / 1024).toFixed(1)} KB` : '—', color: '#00d4ff' },
          { label: 'Total Tokens', value: latest ? latest.totalTokens.toLocaleString() : '—', color: '#8b5cf6' },
          { label: 'Modules', value: latest ? `${latest.modulesCount}` : '—', color: '#f59e0b' },
          { label: 'Queries Processed', value: latest ? latest.queriesProcessed.toLocaleString() : '—', color: '#10b981' },
        ].map((stat, i) => (
          <div key={i} style={CARD}>
            <div style={{ fontSize: 12, color: '#5a6478', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              {stat.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Action buttons ──────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 12,
        marginBottom: 20,
      }}>
        <div style={CARD}>
          <h3 style={{ ...SECTION_TITLE, marginBottom: 12 }}>🔄 Recheck Modules</h3>
          <p style={{ fontSize: 12, color: '#5a6478', marginBottom: 14, lineHeight: 1.4 }}>
            Re-scan all registered modules for changes and update connection status.
          </p>
          <button
            onClick={handleRecheck}
            disabled={rechecking}
            style={{
              width: '100%',
              padding: '10px 0',
              fontSize: 13,
              fontWeight: 600,
              color: '#e4e8f0',
              background: rechecking
                ? 'rgba(255,255,255,0.04)'
                : 'rgba(0, 212, 255, 0.12)',
              border: rechecking
                ? '1px solid rgba(255,255,255,0.08)'
                : '1px solid rgba(0, 212, 255, 0.3)',
              borderRadius: 8,
              cursor: rechecking ? 'not-allowed' : 'pointer',
              opacity: rechecking ? 0.5 : 1,
            }}
          >
            {rechecking ? '⏳ Rechecking…' : '🔍 Recheck Modules'}
          </button>
          {recheckMsg && (
            <div style={{
              marginTop: 10, fontSize: 12,
              color: recheckMsg.startsWith('✅') ? '#10b981' : '#ef4444',
            }}>
              {recheckMsg}
            </div>
          )}
        </div>

        <div style={CARD}>
          <h3 style={{ ...SECTION_TITLE, marginBottom: 12 }}>🔄 Refresh Views</h3>
          <p style={{ fontSize: 12, color: '#5a6478', marginBottom: 14, lineHeight: 1.4 }}>
            Reload all data views and refresh the dashboard metrics from the engine.
          </p>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              width: '100%',
              padding: '10px 0',
              fontSize: 13,
              fontWeight: 600,
              color: '#e4e8f0',
              background: refreshing
                ? 'rgba(255,255,255,0.04)'
                : 'rgba(139, 92, 246, 0.12)',
              border: refreshing
                ? '1px solid rgba(255,255,255,0.08)'
                : '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: 8,
              cursor: refreshing ? 'not-allowed' : 'pointer',
              opacity: refreshing ? 0.5 : 1,
            }}
          >
            {refreshing ? '⏳ Refreshing…' : '🔄 Refresh Views'}
          </button>
          {refreshMsg && (
            <div style={{
              marginTop: 10, fontSize: 12,
              color: refreshMsg.startsWith('✅') ? '#10b981' : '#ef4444',
            }}>
              {refreshMsg}
            </div>
          )}
        </div>
      </div>

      {/* ── Config ──────────────────────────────────────── */}
      <div style={CARD}>
        <h3 style={SECTION_TITLE}>⚙️ Engine Configuration</h3>
        {configData.loading ? (
          <div style={CENTER}>Loading…</div>
        ) : configData.error ? (
          <div style={{ color: '#ef4444', fontSize: 13, padding: 20 }}>{configData.error}</div>
        ) : !config ? (
          <div style={MUTED}>No configuration available</div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 10,
          }}>
            {Object.entries(config)
              .filter(([, v]) => typeof v !== 'object' || v === null)
              .map(([key, value]) => (
                <div key={key} style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <div style={{ fontSize: 10, color: '#5a6478', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                    {key}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#e4e8f0', wordBreak: 'break-word' }}>
                    {String(value ?? '—')}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
