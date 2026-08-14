import React from 'react';
import { cn } from '~/shared/lib/cn';

type DonutSlice = {
  label: string;
  value: number;
  color: string;
};

type DonutChartProps = {
  slices: DonutSlice[];
  size?: number;
  strokeWidth?: number;
  showLegend?: boolean;
  legendPosition?: 'right' | 'bottom';
};

const PALETTE = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b',
  '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

export function DonutChart({ slices, size = 140, strokeWidth = 20, showLegend = true, legendPosition = 'right' }: DonutChartProps) {
  if (!slices || slices.length === 0) {
    return <div className={cn('relative', legendPosition === 'right' ? 'w-[280px]' : 'w-full')}><div className="h-[140px] w-full bg-muted/20 rounded-full animate-pulse" /></div>;
  }

  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const centerX = size / 2;
  const centerY = size / 2;

  let currentAngle = -Math.PI / 2;

  const segments = slices.map((slice, i) => {
    const percentage = slice.value / total;
    const angle = percentage * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const startX = centerX + radius * Math.cos(startAngle);
    const startY = centerY + radius * Math.sin(startAngle);
    const endX = centerX + radius * Math.cos(endAngle);
    const endY = centerY + radius * Math.sin(endAngle);

    const largeArcFlag = angle > Math.PI ? 1 : 0;

    const pathD = [
      `M ${startX} ${startY}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`
    ].join(' ');

    return {
      ...slice,
      pathD,
      percentage: Math.round(percentage * 100)
    };
  });

  return (
    <div className={cn('flex items-center gap-6', legendPosition === 'right' ? 'justify-center' : 'flex-col')}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          {segments.map((seg, i) => (
            <path
              key={i}
              d={seg.pathD}
              stroke={seg.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
        </div>
      </div>

      {showLegend && (
        <ul className={cn('space-y-2', legendPosition === 'right' ? 'flex-1 min-w-0' : 'flex flex-wrap justify-center gap-x-4 gap-y-2')}>
          {segments.map((seg, i) => (
            <li key={i} className={cn('flex items-center gap-2', legendPosition === 'bottom' && 'flex-1 min-w-[80px]')}>
              <div className={cn('w-3 h-3 rounded-full flex-shrink-0', legendPosition === 'bottom' && 'mx-auto')} style={{ background: seg.color }} />
              <span className="text-xs text-foreground truncate">{seg.label}</span>
              <span className={cn('text-xs font-medium text-muted-foreground', legendPosition === 'bottom' && 'ml-auto')}>{seg.percentage}%</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}