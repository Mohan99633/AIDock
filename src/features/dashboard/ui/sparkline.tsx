import React, { useMemo } from 'react';
import { cn } from '~/shared/lib/cn';

type SparklineProps = {
  data: number[];
  color?: string;
  strokeWidth?: number;
  height?: number;
  width?: number;
};

export function Sparkline({ data, color = '#3b82f6', strokeWidth = 2, height = 40, width = 120 }: SparklineProps) {
  if (!data || data.length === 0) return <div className="h-10 w-full bg-muted/20 rounded-md animate-pulse" />;

  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}
