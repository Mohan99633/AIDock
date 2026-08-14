import React from 'react';
import { cn } from '~/shared/lib/cn';

type BarChartProps = {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  barWidth?: number;
  gap?: number;
};

export function BarChart({ data, height = 120, barWidth = 24, gap = 12 }: BarChartProps) {
  if (!data || data.length === 0) return <div className="h-32 w-full bg-muted/20 rounded-md animate-pulse" />;

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end gap-[12px] h-[120px]">
      {data.map(({ label, value, color = '#3b82f6' }, i) => {
        const barHeight = Math.max((value / max) * height, 2);
        return (
          <div key={i} className="flex flex-col items-center gap-2">
            <div
              className={cn('rounded-t transition-all duration-500', 'bg-gradient-to-t')}
              style={{
                width: barWidth,
                height: barHeight,
                background: `linear-gradient(to top, ${color}, ${color}dd)`
              }}
            />
            <span className="text-xs text-muted-foreground text-center w-[40px] truncate" title={label}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}