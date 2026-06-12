import React from 'react';
import { usePolling } from '../hooks/usePolling';
import { KPICard } from '../components/KPICard';
import { Sparkline } from '../components/Sparkline';

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
interface BalanceData {
  balance: number;
  currency: string;
  dailyLimit?: number;
  spentToday?: number;
}

interface ProviderCost {
  provider: string;
  model: string;
  calls: number;
  cost: number;
  avgCostPerCall: number;
}

interface ProviderData { providers: ProviderCost[]; }

interface AgentCostItem {
  agentId: string;
  name: string;
  department: string;
  totalCost: number;
  totalCalls: number;
  avgSavingsPercent: number;
}

interface AgentCostData {
  agents: AgentCostItem[];
  totalSpent: number;
  totalSaved: number;
  netCost: number;
  trend?: number[];
}

/* ── component ───────────────────────────────────────────── */
export default function Cost() {
  const balance    = usePolling<BalanceData>('/api/cost/balance', 30_000);
  const providers  = usePolling<ProviderData>('/api/cost/providers?hours=24', 30_000);
  const agentCost  = usePolling<AgentCostData>('/api/cost?hours=24', 30_000);

  if (balance.loading && providers.loading && agentCost.loading) {
    return <div style={CENTER}>Loading…</div>;
  }

  const bal = balance.data;
  const provs = providers.data?.providers || [];
  const ac = agentCost.data;

  /* Aggregate by provider */
  const byProvider: Record<string, { calls: number; cost: number }> = {};
  provs.forEach((p) => {
    if (!byProvider[p.provider]) byProvider[p.provider] = { calls: 0, cost: 0 };
    byProvider[p.provider].calls += p.calls;
    byProvider[p.provider].cost += p.cost;
  });

  const providerList = Object.entries(byProvider).sort((a, b) => b[1].cost - a[1].cost);

  /* gauge helpers */
  const spentToday  = bal?.spentToday ?? ac?.totalSpent ?? 0;
  const dailyLimit  = bal?.dailyLimit ?? 100;
  const gaugePct    = Math.min((spentToday / dailyLimit) * 100, 100);

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* ── Balance + KPI row ───────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        <KPICard
          label="Balance"
          value={`$${bal?.balance?.toFixed(2) ?? '—'}`}
          sub={bal?.currency ? `Currency: ${bal.currency}` : undefined}
          color="#00d4ff"
        />
        <KPICard
          label="Spent Today"
          value={`$${spentToday.toFixed(4)}`}
          sub={`${gaugePct.toFixed(1)}% of daily limit`}
          color={gaugePct > 80 ? '#ef4444' : gaugePct > 50 ? '#f59e0b' : '#10b981'}
        />
        <KPICard
          label="Total Saved"
          value={`$${ac?.totalSaved?.toFixed(4) ?? '—'}`}
          sub="from TOON compression"
          color="#10b981"
        />
        <KPICard
          label="Net Cost"
          value={`$${ac?.netCost?.toFixed(4) ?? '—'}`}
          sub="spent − saved"
          color={ac && ac.netCost < 0 ? '#10b981' : '#ef4444'}
        />
      </div>

      {/* ── Daily gauge ─────────────────────────────────── */}
      <div style={CARD}>
        <h3 style={SECTION_TITLE}>📊 Daily Spend Gauge</h3>
        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
          <span style={{ color: '#5a6478' }}>$0</span>
          <span style={{ color: '#5a6478' }}>${dailyLimit.toFixed(2)} limit</span>
        </div>
        <div style={{
          width: '100%', height: 12, borderRadius: 6,
          background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
        }}>
          <div style={{
            width: `${gaugePct}%`, height: '100%', borderRadius: 6,
            background: gaugePct > 80
              ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
              : 'linear-gradient(90deg, #10b981, #00d4ff)',
            transition: 'width 0.5s ease',
          }} />
        </div>
        <div style={{ fontSize: 11, color: '#5a6478', marginTop: 4 }}>
          ${spentToday.toFixed(4)} / ${dailyLimit.toFixed(2)}
        </div>
      </div>

      {/* ── Trend sparkline ─────────────────────────────── */}
      {ac?.trend && ac.trend.length > 1 && (
        <div style={CARD}>
          <h3 style={SECTION_TITLE}>📈 Cost Trend (24h)</h3>
          <Sparkline data={ac.trend} width={600} height={48} color="#00d4ff" />
        </div>
      )}

      {/* ── Provider breakdown ──────────────────────────── */}
      <div style={CARD}>
        <h3 style={SECTION_TITLE}>🔌 Provider Breakdown (24h)</h3>
        {providers.loading ? (
          <div style={CENTER}>Loading…</div>
        ) : providers.error ? (
          <div style={{ color: '#ef4444', fontSize: 13, padding: 20 }}>{providers.error}</div>
        ) : providerList.length === 0 ? (
          <div style={MUTED}>No provider data yet</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={TH}>Provider</th>
                <th style={{ ...TH, textAlign: 'right' }}>Calls</th>
                <th style={{ ...TH, textAlign: 'right' }}>Cost</th>
                <th style={{ ...TH, width: '30%' }}>Share</th>
              </tr>
            </thead>
            <tbody>
              {providerList.map(([name, data]) => {
                const totalCost = providerList.reduce((s, [, d]) => s + d.cost, 0) || 1;
                const pct = (data.cost / totalCost) * 100;
                return (
                  <tr key={name}>
                    <td style={TD}>{name}</td>
                    <td style={{ ...TD, textAlign: 'right' }}>{data.calls}</td>
                    <td style={{ ...TD, textAlign: 'right', color: '#ef4444' }}>
                      ${data.cost.toFixed(4)}
                    </td>
                    <td style={{ ...TD, paddingTop: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          flex: 1, height: 6, borderRadius: 3,
                          background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
                        }}>
                          <div style={{
                            width: `${pct}%`, height: '100%', borderRadius: 3,
                            background: '#00d4ff',
                          }} />
                        </div>
                        <span style={{ fontSize: 11, color: '#5a6478', minWidth: 40, textAlign: 'right' }}>
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Agent cost table ────────────────────────────── */}
      <div style={CARD}>
        <h3 style={SECTION_TITLE}>👥 Agent Cost</h3>
        {agentCost.loading ? (
          <div style={CENTER}>Loading…</div>
        ) : agentCost.error ? (
          <div style={{ color: '#ef4444', fontSize: 13, padding: 20 }}>{agentCost.error}</div>
        ) : (ac?.agents || []).length === 0 ? (
          <div style={MUTED}>No agent cost data yet</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={TH}>Agent</th>
                <th style={TH}>Dept</th>
                <th style={{ ...TH, textAlign: 'right' }}>Calls</th>
                <th style={{ ...TH, textAlign: 'right' }}>Cost</th>
                <th style={{ ...TH, textAlign: 'right' }}>Savings</th>
              </tr>
            </thead>
            <tbody>
              {(ac?.agents || [])
                .sort((a, b) => b.totalCost - a.totalCost)
                .map((a, i) => (
                  <tr key={i}>
                    <td style={TD}>{a.name}</td>
                    <td style={{ ...TD, color: '#5a6478' }}>{a.department}</td>
                    <td style={{ ...TD, textAlign: 'right' }}>{a.totalCalls}</td>
                    <td style={{ ...TD, textAlign: 'right', color: '#ef4444' }}>
                      ${a.totalCost?.toFixed(6) ?? '0'}
                    </td>
                    <td style={{ ...TD, textAlign: 'right', color: '#10b981' }}>
                      {a.avgSavingsPercent?.toFixed(1) ?? '0'}%
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
