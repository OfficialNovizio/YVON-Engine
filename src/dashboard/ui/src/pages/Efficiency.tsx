import React from 'react';
import { usePolling } from '../hooks/usePolling';
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

const TH: React.CSSProperties = {
  textAlign: 'left' as const,
  fontSize: 11,
  fontWeight: 600,
  color: '#5a6478',
  textTransform: 'uppercase' as const,
  letterSpacing: 0.5,
  padding: '8px 12px',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
};

const TD: React.CSSProperties = {
  fontSize: 13,
  color: '#e4e8f0',
  padding: '10px 12px',
  borderBottom: '1px solid rgba(255,255,255,0.03)',
};

/* ── types ───────────────────────────────────────────────── */
interface TaskTypeItem {
  taskType: string;
  calls: number;
  avgSavingsPercent: number;
  totalSaved: number;
}

interface WeekDayItem {
  day: string;
  queries: number;
  cost: number;
  savings: number;
}

interface ContentTypeItem {
  contentType: string;
  calls: number;
  avgSavingsPercent: number;
}

interface ModuleItem {
  name: string;
  coveragePercent: number;
  status: string;
}

interface StatsByTask { byTaskType: TaskTypeItem[]; }
interface WeeklyData { days: WeekDayItem[]; }
interface ContentTypeData { types: ContentTypeItem[]; }
interface ModulesData { modules: ModuleItem[]; }

/* ── component ───────────────────────────────────────────── */
export default function Efficiency() {
  const taskStats    = usePolling<StatsByTask>('/api/engine/stats?hours=24', 30_000);
  const weekly       = usePolling<WeeklyData>('/api/efficiency/weekly?days=7', 30_000);
  const contentTypes = usePolling<ContentTypeData>('/api/efficiency/content-types', 30_000);
  const modules      = usePolling<ModulesData>('/api/modules', 30_000);

  if (taskStats.loading && weekly.loading && contentTypes.loading && modules.loading) {
    return <div style={CENTER}>Loading…</div>;
  }

  const tasks = taskStats.data?.byTaskType || [];
  const days  = weekly.data?.days || [];
  const types = contentTypes.data?.types || [];

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* ── Section 1: Task Efficiency ──────────────────── */}
      <div style={CARD}>
        <h3 style={SECTION_TITLE}>📊 Task Efficiency</h3>
        {taskStats.loading ? (
          <div style={CENTER}>Loading…</div>
        ) : taskStats.error ? (
          <div style={{ color: '#ef4444', fontSize: 13, padding: 20 }}>{taskStats.error}</div>
        ) : tasks.length === 0 ? (
          <div style={MUTED}>No task data yet</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={TH}>Task Type</th>
                <th style={{ ...TH, textAlign: 'right' }}>Calls</th>
                <th style={{ ...TH, textAlign: 'right' }}>Saved</th>
                <th style={{ ...TH, width: '40%' }}>Efficiency</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t, i) => (
                <tr key={i}>
                  <td style={TD}>{t.taskType}</td>
                  <td style={{ ...TD, textAlign: 'right' }}>{t.calls}</td>
                  <td style={{ ...TD, textAlign: 'right', color: '#10b981' }}>
                    ${t.totalSaved?.toFixed(4) ?? '0'}
                  </td>
                  <td style={{ ...TD, paddingTop: 14 }}>
                    <GradedBar
                      value={t.avgSavingsPercent}
                      max={100}
                      color="#00d4ff"
                      label={`${t.avgSavingsPercent.toFixed(1)}%`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Section 2: Weekly Efficiency ────────────────── */}
      <div style={CARD}>
        <h3 style={SECTION_TITLE}>📅 Weekly Efficiency (7 days)</h3>
        {weekly.loading ? (
          <div style={CENTER}>Loading…</div>
        ) : weekly.error ? (
          <div style={{ color: '#ef4444', fontSize: 13, padding: 20 }}>{weekly.error}</div>
        ) : days.length === 0 ? (
          <div style={MUTED}>No weekly data yet</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={TH}>Day</th>
                <th style={{ ...TH, textAlign: 'right' }}>Queries</th>
                <th style={{ ...TH, textAlign: 'right' }}>Cost</th>
                <th style={{ ...TH, textAlign: 'right' }}>Savings</th>
              </tr>
            </thead>
            <tbody>
              {days.map((d, i) => (
                <tr key={i}>
                  <td style={TD}>{d.day}</td>
                  <td style={{ ...TD, textAlign: 'right' }}>{d.queries}</td>
                  <td style={{ ...TD, textAlign: 'right', color: '#ef4444' }}>
                    ${d.cost?.toFixed(4) ?? '0'}
                  </td>
                  <td style={{ ...TD, textAlign: 'right', color: '#10b981' }}>
                    ${d.savings?.toFixed(4) ?? '0'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Section 3: Content Type Efficiency ──────────── */}
      <div style={CARD}>
        <h3 style={SECTION_TITLE}>📝 Code Compact Efficiency</h3>
        {contentTypes.loading ? (
          <div style={CENTER}>Loading…</div>
        ) : contentTypes.error ? (
          <div style={{ color: '#ef4444', fontSize: 13, padding: 20 }}>{contentTypes.error}</div>
        ) : types.length === 0 ? (
          <div style={MUTED}>No content type data yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {types.map((ct, i) => (
              <div key={i}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 13, marginBottom: 4,
                }}>
                  <span style={{ color: '#e4e8f0' }}>{ct.contentType}</span>
                  <span style={{ color: '#5a6478' }}>{ct.calls} calls</span>
                </div>
                <GradedBar
                  value={ct.avgSavingsPercent}
                  max={100}
                  color="#8b5cf6"
                  label={`${ct.avgSavingsPercent.toFixed(1)}%`}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Section 4: Module TOONing ───────────────────── */}
      <div style={CARD}>
        <h3 style={SECTION_TITLE}>🔧 Module TOONing Coverage</h3>
        {modules.loading ? (
          <div style={CENTER}>Loading…</div>
        ) : modules.error ? (
          <div style={{ color: '#ef4444', fontSize: 13, padding: 20 }}>{modules.error}</div>
        ) : (modules.data?.modules || []).length === 0 ? (
          <div style={MUTED}>No modules yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(modules.data?.modules || []).map((m, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div>
                  <div style={{ fontSize: 13, color: '#e4e8f0', fontWeight: 500 }}>
                    {m.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#5a6478' }}>
                    {m.status}
                  </div>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: m.coveragePercent >= 80 ? '#10b981'
                         : m.coveragePercent >= 50 ? '#f59e0b'
                         : '#ef4444',
                  }}>
                    {m.coveragePercent}%
                  </span>
                  <div style={{
                    width: 80, height: 6, borderRadius: 3,
                    background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${m.coveragePercent}%`, height: '100%',
                      borderRadius: 3,
                      background: m.coveragePercent >= 80 ? '#10b981'
                                : m.coveragePercent >= 50 ? '#f59e0b'
                                : '#ef4444',
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
