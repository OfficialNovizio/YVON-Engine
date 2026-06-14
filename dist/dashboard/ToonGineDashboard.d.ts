import React from 'react';
import type { TokenBurnData, ProjectHealthData } from './types';
interface Props {
    tab: 'burn' | 'health';
    tokenBurnData: TokenBurnData | null;
    projectHealthData: ProjectHealthData | null;
}
/** Renders a single tab's content. Parent controls tab selection. */
export declare function ToonGineDashboard({ tab, tokenBurnData, projectHealthData }: Props): React.JSX.Element;
export {};
//# sourceMappingURL=ToonGineDashboard.d.ts.map