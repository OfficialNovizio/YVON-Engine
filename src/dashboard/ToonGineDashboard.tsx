import React from 'react'
import type { TokenBurnData, ProjectHealthData } from './types'
import { TokenBurn } from './TokenBurn'
import { ProjectHealth } from './ProjectHealth'

interface Props {
  tab: 'burn' | 'health'
  tokenBurnData: TokenBurnData | null
  projectHealthData: ProjectHealthData | null
}

/** Renders a single tab's content. Parent controls tab selection. */
export function ToonGineDashboard({ tab, tokenBurnData, projectHealthData }: Props) {
  if (tab === 'burn') return <TokenBurn data={tokenBurnData!} />
  return <ProjectHealth data={projectHealthData!} />
}
