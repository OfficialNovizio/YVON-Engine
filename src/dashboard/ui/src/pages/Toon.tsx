import React from 'react';
import { usePolling } from '../hooks/usePolling';
import { QueryLog } from '../components/QueryLog';
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

/* ── types ───────────────────────────────────────────────── */
interface CompileItem {
  id: string;
  timestamp: string;
  corpusSize: number;
  totalTokens: number;
  tokenSavingsPercent: number;
  modulesCount: number;
  queriesProcessed: number;
}

interface CompilesData { compiles: CompileItem[]; }

interface ContentTypeItem {
  contentType: string;
  calls: number;
  avgSavingsPercent: number;
  totalSaved: number;
}

interface ContentTypeData { types: ContentTypeItem[]; }

interface QueryItem {
  id: string;
  query: string;
  model: string;
  savings: number;
  timestamp: string;
}

interface QueriesData { queries: QueryItem[]; }

/* ── component ───────────────────────────────────────────── */
export default function Toon() {
  const compiles     = usePolling<CompilesData>('/api/compiles?limit=20', 30_000);
  const contentTypes = usePolling<ContentTypeData>('/api/efficiency/content-types', 30_000);
  const queries      = usePolling<QueriesData>('/api/engine/queries?limit=50', 30_000);

  const [rebuilding, setRebuilding] = React.useState(false);
  const [rebuildMsg, setRebuildMsg] = React.useState('');

  if (compiles.loading && contentTypes.loading && queries.loading) {
    return <div style={CENTER}>Loading…</div>;
  }

  const latest = compiles.data?.compiles?.[0];
  const types  = contentTypes.data?.types || [];
  const allQueries = queries.data?.queries || [];

  /* Rebuild handler */
  const handleRebuild = async () => {
    setRebuilding(true);
    setRebuildMsg('');
    try {
      const res = await fetch('/api/modules/recheck', { method: 'POST' });
      if (res.ok) {
        setRebuildMsg('✅ Rebuild triggered successfully');
      } else {
        setRebuildMsg('❌ Rebuild failed');
      }
    } catch {
      setRebuildMsg('❌ Network error');
    } finally {
      setRebuilding(false);
    }
  };

  const totalSavingsByCategory = types.reduce((sum, t) => sum + (t.totalSaved || 0), 0);

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* ── Corpus stats ───────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12,
        marginBottom: 20,
      }}>
        {[
          { label: 'Corpus Size', value: latest ? `${(latest.corpusSize / 1024).toFixed(1)} KB` : '—', color: '#00d4ff' },
          { label: 'Total Tokens', value: latest ? latest.totalTokens.toLocaleString() : '—', color: '#8b5cf6' },
          { label: 'Token Savings', value: latest ? `${latest.tokenSavingsPercent.toFixed(1)}%` : '—', color: '#10b981' },
          { label: 'Modules', value: latest ? `${latest.modulesCount}` : '—', color: '#f59e0b' },
          { label: 'Queries Processed', value: latest ? latest.queriesProcessed.toLocaleString() : '—', color: '#e4e8f0' },
        ].map((stat, i) => (
          <div key={i} style={CARD}>
            <div style={{ fontSize: 12, color: '#5a6478', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              {stat.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>
              {stat.value}
            </div>
            {latest && (
              <div style={{ fontSize: 11, color: '#5a6478', marginTop: 4 }}>
                {new Date(latest.timestamp).toLocaleDateString()}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Savings by category ────────────────────────── */}
      <div style={CARD}>
        <h3 style={SECTION_TITLE}>
          💰 Savings by Category
          <span style={{ fontSize: 12, color: '#5a6478', fontWeight: 400, marginLeft: 8 }}>
            Total: ${totalSavingsByCategory.toFixed(4)}
          </span>
        </h3>
        {contentTypes.loading ? (
          <div style={CENTER}>Loading…</div>
        ) : contentTypes.error ? (
          <div style={{ color: '#ef4444', fontSize: 13, padding: 20 }}>{contentTypes.error}</div>
        ) : types.length === 0 ? (
          <div style={MUTED}>No savings data yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {types.map((ct, i) => (
              <div key={i}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 13, marginBottom: 4,
                }}>
                  <span style={{ color: '#e4e8f0' }}>{ct.contentType}</span>
                  <span>
                    <span style={{ color: '#10b981' }}>${ct.totalSaved?.toFixed(4) ?? '0'}</span>
                    <span style={{ color: '#5a6478', marginLeft: 6 }}>{ct.calls} calls</span>
                  </span>
                </div>
                <GradedBar
                  value={ct.avgSavingsPercent}
                  max={100}
                  color="#00d4ff"
                  label={`${ct.avgSavingsPercent.toFixed(1)}% savings`}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Query log + Rebuild ────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: 16,
      }}>
        {/* Query log */}
        <div style={CARD}>
          <h3 style={SECTION_TITLE}>📋 Query Log</h3>
          {queries.loading ? (
            <div style={CENTER}>Loading…</div>
          ) : queries.error ? (
            <div style={{ color: '#ef4444', fontSize: 13, padding: 20 }}>{queries.error}</div>
          ) : allQueries.length === 0 ? (
            <div style={MUTED}>No queries yet</div>
          ) : (
            <QueryLog queries={allQueries.slice(0, 20)} maxHeight={400} />
          )}
        </div>

        {/* Rebuild panel */}
        <div style={CARD}>
          <h3 style={SECTION_TITLE}>🔧 Rebuild Corpus</h3>
          <p style={{ fontSize: 13, color: '#5a6478', marginBottom: 16, lineHeight: 1.5 }}>
            Trigger a full module recheck to rebuild the TOON corpus. This will re-analyze
            all modules and update compression metadata.
          </p>

          <button
            onClick={handleRebuild}
            disabled={rebuilding}
            style={{
              width: '100%',
              padding: '12px 0',
              fontSize: 14,
              fontWeight: 600,
              color: '#e4e8f0',
              background: rebuilding
                ? 'rgba(255,255,255,0.04)'
                : 'rgba(0, 212, 255, 0.12)',
              border: rebuilding
                ? '1px solid rgba(255,255,255,0.08)'
                : '1px solid rgba(0, 212, 255, 0.3)',
              borderRadius: 10,
              cursor: rebuilding ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: rebuilding ? 0.5 : 1,
            }}
          >
            {rebuilding ? '⏳ Rebuilding…' : '🔄 Rebuild Now'}
          </button>

          {rebuildMsg && (
            <div style={{
              marginTop: 12, padding: '10px 14px',
              borderRadius: 8, fontSize: 13,
              background: rebuildMsg.startsWith('✅')
                ? 'rgba(16, 185, 129, 0.08)'
                : 'rgba(239, 68, 68, 0.08)',
              color: rebuildMsg.startsWith('✅') ? '#10b981' : '#ef4444',
              border: `1px solid ${rebuildMsg.startsWith('✅')
                ? 'rgba(16, 185, 129, 0.2)'
                : 'rgba(239, 68, 68, 0.2)'}`,
            }}>
              {rebuildMsg}
            </div>
          )}

          {/* Latest compile info */}
          {latest && (
            <div style={{
              marginTop: 20, padding: '12px 14px',
              background: 'rgba(255,255,255,0.02)',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{ fontSize: 12, color: '#5a6478', marginBottom: 6 }}>
                Latest Compile
              </div>
              <div style={{ fontSize: 13, color: '#e4e8f0' }}>
                ID: {latest.id}
              </div>
              <div style={{ fontSize: 12, color: '#5a6478' }}>
                {new Date(latest.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
