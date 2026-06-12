import React, { useState, useEffect } from 'react';
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

const SELECT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  fontSize: 14,
  color: '#e4e8f0',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8,
  outline: 'none',
  cursor: 'pointer',
  appearance: 'none',
  MozAppearance: 'none',
  WebkitAppearance: 'none',
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
interface ProviderInfo {
  name: string;
  models: { id: string; name: string; inputPrice: number; outputPrice: number }[];
}

interface ProvidersData { providers: ProviderInfo[]; }

interface AgentListItem {
  agentId: string;
  name: string;
  department: string;
}

interface AgentsData { agents: AgentListItem[]; }

interface SimulateRequest {
  provider: string;
  model: string;
  agentId?: string;
}

interface SimulateResult {
  provider: string;
  model: string;
  monthlyCost: number;
  currentMonthlyCost: number;
  avgLatencyMs: number;
  estimatedSavings: number;
  savingsPercent: number;
  inputTokens: number;
  outputTokens: number;
  pricing: { inputPrice: number; outputPrice: number };
}

/* ── component ───────────────────────────────────────────── */
export default function Simulator() {
  const providersData = usePolling<ProvidersData>('/api/simulator/providers', 60_000);
  const agentsData    = usePolling<AgentsData>('/api/agents/efficiency?hours=24', 30_000);

  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState<SimulateResult | null>(null);
  const [error, setError] = useState('');

  if (providersData.loading && agentsData.loading) {
    return <div style={CENTER}>Loading…</div>;
  }

  const providers = providersData.data?.providers || [];
  const agents    = agentsData.data?.agents || [];

  /* Set defaults on first load */
  const currentProvider = providers.find((p) => p.name === selectedProvider);
  const models = currentProvider?.models || [];
  const selectedModelData = models.find((m) => m.id === selectedModel);

  /* Auto-select first provider/model if none selected */
  useEffect(() => {
    if (providers.length > 0 && !selectedProvider) {
      setSelectedProvider(providers[0].name);
    }
  }, [providers, selectedProvider]);

  useEffect(() => {
    if (currentProvider && models.length > 0 && !selectedModel) {
      setSelectedModel(models[0].id);
    }
  }, [currentProvider, models, selectedModel]);

  /* Price reference table */
  const allModels = providers.flatMap((p) =>
    p.models.map((m) => ({
      provider: p.name,
      model: m.id,
      modelName: m.name,
      inputPrice: m.inputPrice,
      outputPrice: m.outputPrice,
    }))
  );

  const handleSimulate = async () => {
    if (!selectedProvider || !selectedModel) return;
    setSimulating(true);
    setError('');
    setResult(null);
    try {
      const body: SimulateRequest = {
        provider: selectedProvider,
        model: selectedModel,
      };
      if (selectedAgent) body.agentId = selectedAgent;

      const res = await fetch('/api/simulator/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Simulation failed');
      }
      const data: SimulateResult = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Network error');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* ── Selector panel ──────────────────────────────── */}
      <div style={CARD}>
        <h3 style={SECTION_TITLE}>🧪 Cost Simulator</h3>
        <p style={{ fontSize: 13, color: '#5a6478', marginBottom: 20, lineHeight: 1.5 }}>
          Compare what your costs would look like using a different provider or model.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
          marginBottom: 16,
        }}>
          {/* Provider selector */}
          <div>
            <label style={{ fontSize: 11, color: '#5a6478', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Provider
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={selectedProvider}
                onChange={(e) => { setSelectedProvider(e.target.value); setSelectedModel(''); }}
                style={SELECT_STYLE}
              >
                {providers.map((p) => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
              <span style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                pointerEvents: 'none', color: '#5a6478', fontSize: 10,
              }}>▼</span>
            </div>
          </div>

          {/* Model selector */}
          <div>
            <label style={{ fontSize: 11, color: '#5a6478', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Model
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                style={SELECT_STYLE}
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <span style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                pointerEvents: 'none', color: '#5a6478', fontSize: 10,
              }}>▼</span>
            </div>
          </div>

          {/* Agent selector */}
          <div>
            <label style={{ fontSize: 11, color: '#5a6478', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Agent (optional)
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                style={SELECT_STYLE}
              >
                <option value="">All Agents</option>
                {agents.map((a) => (
                  <option key={a.agentId} value={a.agentId}>
                    {a.name} ({a.department})
                  </option>
                ))}
              </select>
              <span style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                pointerEvents: 'none', color: '#5a6478', fontSize: 10,
              }}>▼</span>
            </div>
          </div>
        </div>

        {/* Current selection info */}
        {selectedModelData && (
          <div style={{
            padding: '10px 14px', marginBottom: 16,
            background: 'rgba(255,255,255,0.02)',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.05)',
            fontSize: 12,
            color: '#5a6478',
          }}>
            {selectedModelData.name} — Input: ${selectedModelData.inputPrice}/1M tok · Output: ${selectedModelData.outputPrice}/1M tok
          </div>
        )}

        <button
          onClick={handleSimulate}
          disabled={simulating || !selectedProvider || !selectedModel}
          style={{
            width: '100%',
            padding: '12px 0',
            fontSize: 14,
            fontWeight: 600,
            color: '#e4e8f0',
            background: simulating
              ? 'rgba(255,255,255,0.04)'
              : 'rgba(139, 92, 246, 0.12)',
            border: simulating
              ? '1px solid rgba(255,255,255,0.08)'
              : '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: 10,
            cursor: simulating ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            opacity: simulating ? 0.5 : 1,
          }}
        >
          {simulating ? '⏳ Simulating…' : '🚀 SIMULATE'}
        </button>

        {error && (
          <div style={{
            marginTop: 12, padding: '10px 14px',
            borderRadius: 8, fontSize: 13,
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
          }}>
            {error}
          </div>
        )}
      </div>

      {/* ── Simulation results ──────────────────────────── */}
      {result && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          marginBottom: 20,
        }}>
          {[
            {
              label: 'Monthly Cost',
              value: `$${result.monthlyCost.toFixed(2)}`,
              sub: `${result.provider} / ${result.model}`,
              color: '#ef4444',
            },
            {
              label: 'vs Current',
              value: `$${result.currentMonthlyCost.toFixed(2)}`,
              sub: result.monthlyCost < result.currentMonthlyCost
                ? `Save $${(result.currentMonthlyCost - result.monthlyCost).toFixed(2)}`
                : `+$${(result.monthlyCost - result.currentMonthlyCost).toFixed(2)} more`,
              color: result.monthlyCost < result.currentMonthlyCost ? '#10b981' : '#ef4444',
            },
            {
              label: 'Avg Latency',
              value: `${result.avgLatencyMs}ms`,
              sub: 'estimated',
              color: '#f59e0b',
            },
            {
              label: 'Est. Savings',
              value: `${result.savingsPercent.toFixed(1)}%`,
              sub: `$${result.estimatedSavings.toFixed(2)} saved`,
              color: '#8b5cf6',
            },
          ].map((kpi, i) => (
            <div key={i} style={CARD}>
              <div style={{ fontSize: 12, color: '#5a6478', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                {kpi.label}
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: kpi.color }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: 12, color: '#5a6478', marginTop: 4 }}>
                {kpi.sub}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Pricing reference table ─────────────────────── */}
      <div style={CARD}>
        <h3 style={SECTION_TITLE}>📋 Provider Pricing Reference</h3>
        {providersData.loading ? (
          <div style={CENTER}>Loading…</div>
        ) : providersData.error ? (
          <div style={{ color: '#ef4444', fontSize: 13, padding: 20 }}>{providersData.error}</div>
        ) : allModels.length === 0 ? (
          <div style={MUTED}>No provider data available</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={TH}>Provider</th>
                <th style={TH}>Model</th>
                <th style={{ ...TH, textAlign: 'right' }}>Input $/1M tok</th>
                <th style={{ ...TH, textAlign: 'right' }}>Output $/1M tok</th>
              </tr>
            </thead>
            <tbody>
              {allModels.map((m, i) => (
                <tr
                  key={i}
                  style={{
                    background: m.provider === selectedProvider && m.model === selectedModel
                      ? 'rgba(139, 92, 246, 0.06)' : 'transparent',
                  }}
                >
                  <td style={TD}>{m.provider}</td>
                  <td style={TD}>{m.modelName}</td>
                  <td style={{ ...TD, textAlign: 'right' }}>${m.inputPrice?.toFixed(4) ?? '—'}</td>
                  <td style={{ ...TD, textAlign: 'right' }}>${m.outputPrice?.toFixed(4) ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
