import { useState, useEffect } from 'react'

interface DashboardData { toon: any; cie: any; cost: any; modules: any[]; agents: any[]; timestamp: number }

export default function App() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [connected, setConnected] = useState(false)
  const [tab, setTab] = useState('all')

  useEffect(() => {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${location.host}/api/live`)
    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onmessage = (e) => {
      try { const msg = JSON.parse(e.data); if (msg.type === 'stats') setData(msg) } catch {}
    }
    return () => ws.close()
  }, [])

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'connections', label: '🔌 Connections' },
    { key: 'toon', label: '📊 TOON' },
    { key: 'cost', label: '💰 Cost' },
    { key: 'cie', label: '⚙️ CIE' },
    { key: 'agents', label: '👥 Agents' },
  ]

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⚡</div>
          <h1 className="text-2xl font-bold mb-2">YVON Dashboard</h1>
          <p className="text-[#5a6478]">Connecting to engine...</p>
          <p className="text-xs text-[#5a6478] mt-4">Start with: <code className="text-[#00d4ff]">npx yvon dashboard</code></p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-6 max-w-[1600px] mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">⚡ YVON Dashboard</h1>
          <p className="text-xs md:text-sm text-[#5a6478]">Engine v1.3.0</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-[#34d399]' : 'bg-[#f87171]'}`} />
          <span className="text-xs md:text-sm text-[#8892a8]">{connected ? 'Live' : 'Reconnecting...'}</span>
        </div>
      </header>

      {/* Mobile tab bar */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-2 md:hidden">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              tab === t.key ? 'bg-white/10 text-white' : 'text-[#5a6478]'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Desktop tab bar */}
      <div className="hidden md:flex gap-2 mb-6">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              tab === t.key ? 'bg-white/10 text-white' : 'text-[#8892a8] hover:text-white hover:bg-white/5'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Panels */}
      <div className="space-y-4 md:space-y-6">
        {(tab === 'all' || tab === 'connections') && (
          <div className="glass-card p-4 md:p-5">
            <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4">🔌 Connections</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">
              {(data.modules || []).map((m: any, i: number) => (
                <div key={i} className="p-2 md:p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${m.connected ? 'bg-[#34d399]' : m.details?.includes('fallback') ? 'bg-[#f59e0b]' : 'bg-[#f87171]'}`} />
                    <span className="text-xs md:text-sm font-medium truncate">{m.name}</span>
                  </div>
                  <p className="text-[10px] md:text-xs text-[#5a6478] mt-1 truncate">{m.details}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {(tab === 'all' || tab === 'toon') && (
            <div className="glass-card p-4 md:p-5">
              <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4">📊 TOON Compression</h2>
              {data.toon?.total > 0 ? (
                <>
                  <div className="flex items-center justify-center mb-4">
                    <svg width="140" height="80" viewBox="0 0 140 80">
                      <path d="M 15 70 A 55 55 0 0 1 125 70" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
                      <path d="M 15 70 A 55 55 0 0 1 125 70" fill="none" stroke="#00d4ff" strokeWidth="12"
                        strokeDasharray={`${(data.toon.avgSavingsPercent / 100) * 173} 173`} strokeLinecap="round" />
                      <text x="70" y="55" textAnchor="middle" fill="#e4e8f0" fontSize="20" fontWeight="bold">{data.toon.avgSavingsPercent}%</text>
                      <text x="70" y="72" textAnchor="middle" fill="#5a6478" fontSize="10">avg savings</text>
                    </svg>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center mb-4">
                    <div><div className="text-base md:text-lg font-bold">{data.toon.total}</div><div className="text-[10px] md:text-xs text-[#5a6478]">Calls</div></div>
                    <div><div className="text-base md:text-lg font-bold">{(data.toon.totalBytesSaved / 1024).toFixed(1)}KB</div><div className="text-[10px] md:text-xs text-[#5a6478]">Saved</div></div>
                    <div><div className="text-base md:text-lg font-bold text-[#34d399]">${data.toon.totalCostSaved.toFixed(4)}</div><div className="text-[10px] md:text-xs text-[#5a6478]">Saved $</div></div>
                  </div>
                  {Object.keys(data.toon.byModel || {}).length > 0 && (
                    <table className="w-full text-xs">
                      <thead><tr className="text-[#5a6478] border-b border-white/5"><th className="text-left py-1">Model</th><th className="text-right py-1">Calls</th><th className="text-right py-1">Saved</th></tr></thead>
                      <tbody>
                        {Object.entries(data.toon.byModel).map(([m, d]: [string, any]) => (
                          <tr key={m} className="border-b border-white/[0.03]">
                            <td className="py-1">{m}</td><td className="text-right">{d.calls}</td><td className="text-right text-[#34d399]">${d.costSaved.toFixed(6)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              ) : <p className="text-center py-12 text-[#5a6478] text-sm">No TOON calls yet</p>}
            </div>
          )}

          {(tab === 'all' || tab === 'cost') && (
            <div className="glass-card p-4 md:p-5">
              <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4">💰 Cost Tracking</h2>
              {data.cost && Object.keys(data.cost.byModel || {}).length > 0 ? (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4 text-center">
                    <div><div className="text-xs text-[#5a6478]">Spent</div><div className="text-lg md:text-xl font-bold text-[#f87171]">${data.cost.totalSpent.toFixed(4)}</div></div>
                    <div><div className="text-xs text-[#5a6478]">Saved</div><div className="text-lg md:text-xl font-bold text-[#34d399]">${data.cost.totalSaved.toFixed(4)}</div></div>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(data.cost.byModel).map(([m, d]: [string, any]) => (
                      <div key={m} className="flex items-center justify-between text-sm">
                        <span className="text-[#8892a8]">{m}</span>
                        <span className="text-[#f87171]">${d.cost.toFixed(6)} <span className="text-[10px] text-[#5a6478]">({d.calls} calls)</span></span>
                      </div>
                    ))}
                    <div className="border-t border-white/[0.06] pt-2 flex justify-between text-sm font-semibold">
                      <span>Net</span>
                      <span className={data.cost.netCost < 0 ? 'text-[#34d399]' : 'text-[#f87171]'}>${data.cost.netCost.toFixed(4)}</span>
                    </div>
                  </div>
                </>
              ) : <p className="text-center py-12 text-[#5a6478] text-sm">No cost data yet</p>}
            </div>
          )}

          {(tab === 'all' || tab === 'cie') && (
            <div className="glass-card p-4 md:p-5 lg:col-span-2">
              <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4">⚙️ CIE Pipeline</h2>
              {data.cie?.totalTicks > 0 ? (
                <>
                  <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-6">
                    {[
                      { label: 'Classified', value: data.cie.totalTicks, color: '#a78bfa' },
                      { label: 'Retrieved', value: data.cie.totalRetrieved, color: '#00d4ff' },
                      { label: 'Injected', value: data.cie.totalInjected, color: '#34d399' },
                      { label: 'Filtered', value: data.cie.totalFiltered, color: '#f59e0b' },
                    ].map((s, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-center min-w-[70px]">
                          <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ background: s.color }} />
                          <div className="text-base md:text-lg font-bold">{s.value.toLocaleString()}</div>
                          <div className="text-[10px] md:text-xs text-[#5a6478]">{s.label}</div>
                        </div>
                        {i < 3 && <span className="text-[#5a6478]">→</span>}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div><div className="text-sm font-bold">{data.cie.avgLatencyMs}ms</div><div className="text-[10px] text-[#5a6478]">Avg Latency</div></div>
                    <div><div className="text-sm font-bold">{data.cie.totalTicks}</div><div className="text-[10px] text-[#5a6478]">Total Runs</div></div>
                    <div><div className="text-sm font-bold">{data.cie.skipRate}%</div><div className="text-[10px] text-[#5a6478]">Skip Rate</div></div>
                  </div>
                </>
              ) : <p className="text-center py-12 text-[#5a6478] text-sm">No CIE pipeline data yet</p>}
            </div>
          )}
        </div>

        {(tab === 'all' || tab === 'agents') && (
          <div className="glass-card p-4 md:p-5">
            <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4">👥 Agents ({(data.agents || []).length})</h2>
            {data.agents?.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 md:gap-3">
                {data.agents.map((a: any) => (
                  <div key={a.agentId} className="p-2 md:p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${a.status === 'online' ? 'bg-[#34d399]' : a.status === 'idle' ? 'bg-[#f59e0b]' : 'bg-[#f87171]'}`} />
                      <span className="text-xs md:text-sm font-medium truncate">{a.name}</span>
                    </div>
                    <div className="text-[10px] md:text-xs text-[#5a6478]">
                      <div>{a.department}</div>
                      <div>{a.totalCalls} calls</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-center py-8 text-[#5a6478] text-sm">No agent data</p>}
          </div>
        )}
      </div>
    </div>
  )
}
