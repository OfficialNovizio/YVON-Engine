import React from 'react';

interface HeatmapDatum { day: string; hour: number; value: number; }
interface HeatmapProps { data: HeatmapDatum[]; width?: number; }

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const Heatmap: React.FC<HeatmapProps> = ({ data, width = 600 }) => {
  const cellW = (width - 40) / 24;
  const cellH = 16, gap = 2, padLeft = 32, padTop = 8;
  const maxVal = Math.max(...data.map(d => d.value), 1);

  const intensity = (v: number) => {
    const t = v / maxVal;
    const r = Math.round(10 + t * 15), g = Math.round(180 + t * 55), b = Math.round(200 + t * 55);
    return `rgb(${r},${g},${b})`;
  };

  return (
    <svg width={width} height={padTop + 24 * (cellH + gap) + 8} style={{ display: 'block' }}>
      {DAYS.map((day, di) => (
        <text key={'lbl' + di} x={padLeft - 6} y={padTop + di * (cellH + gap) + cellH - 3}
          fill="#5a6478" fontSize={10} textAnchor="end">{day}</text>
      ))}
      {data.map((d, i) => {
        const di = DAYS.indexOf(d.day);
        if (di < 0) return null;
        return (
          <rect key={i} x={padLeft + d.hour * cellW} y={padTop + di * (cellH + gap)}
            width={cellW - gap} height={cellH} rx={2} fill={intensity(d.value)}
            opacity={0.8} />
        );
      })}
    </svg>
  );
};
