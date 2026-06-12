import React from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({ data, width = 160, height = 36, color = '#00d4ff' }) => {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const padX = 4, padY = 4;
  const plotW = width - padX * 2, plotH = height - padY * 2;
  const points = data.map((v, i) => {
    const x = padX + (i / (data.length - 1)) * plotW;
    const y = padY + plotH - ((v - min) / range) * plotH;
    return `${x},${y}`;
  });
  const last = points[points.length - 1].split(',').map(Number);

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <line x1={padX} y1={height - padY} x2={width - padX} y2={height - padY} stroke="rgba(255,255,255,0.06)" />
      <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth={1.5} />
      <circle cx={last[0]} cy={last[1]} r={3} fill={color} />
    </svg>
  );
};
