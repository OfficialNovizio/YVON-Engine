import React, { useState } from 'react'
import type { TokenBurnData, ProjectHealthData } from './types'
import { TokenBurn } from './TokenBurn'
import { ProjectHealth } from './ProjectHealth'

interface Props {
  tokenBurnData: TokenBurnData | null
  projectHealthData: ProjectHealthData | null
}

export function ToonGineDashboard({ tokenBurnData, projectHealthData }: Props) {
  const [tab, setTab] = useState<'burn' | 'health'>('burn')

  return (
    <div>
      {/* Tabs */}
      <div className="mb-5 flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit">
        <button
          onClick={() => setTab('burn')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
            tab === 'burn' ? 'bg-white/[0.08] text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          💰 Token Burn
        </button>
        <button
          onClick={() => setTab('health')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
            tab === 'health' ? 'bg-white/[0.08] text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          🏥 Project Health
        </button>
      </div>

      {/* Tab Content */}
      {tab === 'burn' ? (
        <TokenBurn data={tokenBurnData!} />
      ) : (
        <ProjectHealth data={projectHealthData!} />
      )}
    </div>
  )
}
