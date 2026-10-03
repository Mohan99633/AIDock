import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LayoutDashboard, TrendingUp, Target, BarChart2, PieChart, Calendar, Zap, Brain } from 'lucide-react';
import { cn } from '~/shared/lib/cn';
import { StatTile } from './stat-tile';
import { Sparkline } from './sparkline';
import { BarChart } from './bar-chart';
import { DonutChart } from './donut-chart';
import { storage } from '~/infrastructure/storage/storage.service';
import type { Prompt, PromptHistoryEntry, AINote } from '~/infrastructure/storage/schema';

/**
 * Dashboard Shell - The main analytics view for the popup.
 * Shows productivity metrics, charts, and activity timeline.
 */
export function DashboardShell(): JSX.Element {
  const queryClient = useQueryClient();
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => {
    setRefreshKey((k) => k + 1);
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  useEffect(() => {
    const handleStorageChange = () => refresh();
    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, [refresh]);

  const {
    data: metrics,
    isLoading,
    error
  } = useQuery({
    queryKey: ['dashboard', 'metrics', refreshKey],
    queryFn: async () => {
      const [prompts, history, notes] = await Promise.all([
        storage.prompts.getAll(),
        storage.history.getAll(),
        storage.notes.getAll()
      ]);

      return computeMetrics(prompts, history, notes);
    }
  });

  if (isLoading) return <DashboardSkeleton />;
  if (error) return <DashboardError onRetry={refresh} />;
  if (!metrics) return <DashboardSkeleton />;

  return (
    <div className="flex flex-col h-full w-[380px] p-4 gap-4 overflow-auto bg-background">
      <DashboardHeader onRefresh={refresh} />
      <StatGrid metrics={metrics} />
      <ChartsSection metrics={metrics} />
      <ActivityTimeline history={metrics.recentHistory} />
    </div>
  );
}

function DashboardHeader({ onRefresh }: { onRefresh: () => void }): JSX.Element {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <LayoutDashboard className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Productivity Dashboard</h1>
      </div>
      <button
        onClick={onRefresh}
        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
        aria-label="Refresh dashboard"
      >
        <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 4v6h-6" />
          <path d="M1 20v-6h6" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
      </button>
    </div>
  );
}

function StatGrid({ metrics }: { metrics: DashboardMetrics }): JSX.Element {
  const stats = [
    {
      label: 'Total Prompts',
      value: metrics.totalPrompts,
      subtext: `+${metrics.promptsThisWeek} this week`,
      trend: metrics.promptsThisWeek > metrics.promptsLastWeek ? 'up' as const : 'down' as const,
      icon: <Brain className="h-4 w-4" />
    },
    {
      label: 'AI Interactions',
      value: metrics.totalInteractions,
      subtext: `Avg ${metrics.avgPromptsPerDay.toFixed(1)}/day`,
      trend: metrics.avgPromptsPerDay > 2 ? 'up' as const : 'neutral' as const,
      icon: <Zap className="h-4 w-4" />
    },
    {
      label: 'Saved Prompts',
      value: metrics.savedPrompts,
      subtext: `${metrics.favoritePrompts} favorites`,
      trend: 'neutral' as const,
      icon: <Target className="h-4 w-4" />
    },
    {
      label: 'Notes Taken',
      value: metrics.totalNotes,
      subtext: `${metrics.notesWithImages} with images`,
      trend: 'neutral' as const,
      icon: <PieChart className="h-4 w-4" />
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((s, i) => (
        <StatTile key={i} {...s} />
      ))}
    </div>
  );
}

function ChartsSection({ metrics }: { metrics: DashboardMetrics }): JSX.Element {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Daily Activity</h3>
        <div className="flex items-end gap-2 h-28">
          {metrics.dailyActivity.map((d, i) => (
            <div key={i} className="flex flex-col items-center flex-1 gap-1">
              <div
                className="w-full rounded-t bg-primary/80 transition-all duration-500"
                style={{ height: `${Math.max((d.count / metrics.maxDailyCount) * 100, 2)}%` }}
              />
              <span className="text-xs text-muted-foreground">{d.day}</span>
            </div>
          ))}
        </div>
        <Sparkline data={metrics.dailyActivity.map(d => d.count)} color="hsl(var(--primary))" height={60} width={340} />
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">AI Platform Usage</h3>
        <DonutChart
          slices={metrics.platformUsage.map((p, i) => ({
            label: p.platform,
            value: p.count,
            color: PLATFORM_COLORS[i % PLATFORM_COLORS.length]!
          }))}
          size={140}
          strokeWidth={20}
          showLegend={true}
          legendPosition="right"
        />
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Prompt Categories</h3>
        <BarChart
          data={metrics.categoryBreakdown.map((c, i) => ({
            label: c.category,
            value: c.count,
            color: CATEGORY_COLORS[i % CATEGORY_COLORS.length]
          }))}
        />
      </section>
    </div>
  );
}

function ActivityTimeline({ history }: { history: PromptHistoryEntry[] }): JSX.Element {
  if (!history.length) {
    return (
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Recent Activity</h3>
        <div className="text-center py-6 text-muted-foreground text-sm">
          No activity yet. Start chatting with an AI!
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">Recent Activity</h3>
      <div className="space-y-2 max-h-60 overflow-auto pr-1">
        {history.slice(0, 10).map((entry, i) => (
          <div
            key={entry.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border hover:bg-muted/50 hover:border-primary/30 transition-colors"
          >
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-medium text-primary">{entry.aiPlatform.charAt(0).toUpperCase()}</span>
              </div>
              {i < history.length - 1 && (
                <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-border" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground truncate">{entry.promptContent.slice(0, 60)}…</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatRelativeTime(entry.timestamp)}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                  {entry.aiPlatform}
                </span>
                {entry.tags.length > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                    {entry.tags.slice(0, 2).join(', ')}
                  </span>
                )}
                {entry.isFavorite && (
                  <span className="text-xs text-amber-500">★</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DashboardSkeleton(): JSX.Element {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-5 w-20 bg-muted rounded" />
        <div className="h-8 w-8 bg-muted rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-xl" />
        ))}
      </div>
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-32 bg-muted rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardError({ onRetry }: { onRetry: () => void }): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-6">
      <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
        <svg className="h-6 w-6 text-destructive" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <p className="text-sm text-muted-foreground">Failed to load dashboard</p>
      <button onClick={onRetry} className="px-4 py-2 text-sm font-medium text-primary hover:underline">
        Try again
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Metrics Computation
   ────────────────────────────────────────────── */

interface DailyPoint {
  day: string;
  count: number;
}

interface PlatformStat {
  platform: string;
  count: number;
}

interface CategoryStat {
  category: string;
  count: number;
}

export interface DashboardMetrics {
  totalPrompts: number;
  totalInteractions: number;
  savedPrompts: number;
  totalNotes: number;
  favoritePrompts: number;
  notesWithImages: number;
  promptsThisWeek: number;
  promptsLastWeek: number;
  avgPromptsPerDay: number;
  dailyActivity: DailyPoint[];
  maxDailyCount: number;
  platformUsage: PlatformStat[];
  categoryBreakdown: CategoryStat[];
  recentHistory: PromptHistoryEntry[];
}

const PLATFORM_COLORS = [
  '#10a37f', '#d4a843', '#4285f4', '#6b3df0',
  '#0078d4', '#000000', '#7c3aed', '#00b4d8'
];

const CATEGORY_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#10b981',
  '#f59e0b', '#ef4444', '#06b6d4', '#84cc16'
];

function computeMetrics(
  prompts: Prompt[],
  history: PromptHistoryEntry[],
  notes: AINote[]
): DashboardMetrics {
  const now = Date.now();
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const oneDayMs = 24 * 60 * 60 * 1000;

  // Weekly comparison
  const thisWeekStart = now - oneWeekMs;
  const lastWeekStart = now - 2 * oneWeekMs;

  const promptsThisWeek = history.filter(h => h.timestamp >= thisWeekStart).length;
  const promptsLastWeek = history.filter(h => h.timestamp >= lastWeekStart && h.timestamp < thisWeekStart).length;

  // Daily activity (last 7 days)
  const dailyActivity: DailyPoint[] = [];
  let maxDailyCount = 0;

  for (let i = 6; i >= 0; i--) {
    const dayStart = now - i * oneDayMs;
    const dayEnd = dayStart + oneDayMs;
    const dayName = new Date(dayStart).toLocaleDateString(undefined, { weekday: 'short' });

    const count = history.filter(h => h.timestamp >= dayStart && h.timestamp < dayEnd).length;
    maxDailyCount = Math.max(maxDailyCount, count);
    dailyActivity.push({ day: dayName, count });
  }

  // Platform usage
  const platformMap = new Map<string, number>();
  for (const entry of history) {
    platformMap.set(entry.aiPlatform, (platformMap.get(entry.aiPlatform) || 0) + 1);
  }
  const platformUsage = Array.from(platformMap.entries())
    .map(([platform, count]) => ({ platform, count }))
    .sort((a, b) => b.count - a.count);

  // Category breakdown
  const categoryMap = new Map<string, number>();
  for (const prompt of prompts) {
    if (prompt.category) {
      categoryMap.set(prompt.category, (categoryMap.get(prompt.category) || 0) + 1);
    }
  }
  for (const entry of history) {
    if (entry.category) {
      categoryMap.set(entry.category, (categoryMap.get(entry.category) || 0) + 1);
    }
  }
  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  // Average prompts per day (over last 30 days)
  const thirtyDaysAgo = now - 30 * oneDayMs;
  const recentHistory = history.filter(h => h.timestamp >= thirtyDaysAgo);
  const uniqueDays = new Set(recentHistory.map(h => Math.floor(h.timestamp / oneDayMs))).size;
  const avgPromptsPerDay = uniqueDays > 0 ? recentHistory.length / uniqueDays : 0;

  // Notes with images (detect markdown images)
  const notesWithImages = notes.filter(n => n.content.includes('![') || n.content.includes('<img')).length;

  return {
    totalPrompts: prompts.length + history.length,
    totalInteractions: history.length,
    savedPrompts: prompts.length,
    totalNotes: notes.length,
    favoritePrompts: prompts.filter(p => p.isFavorite).length,
    notesWithImages,
    promptsThisWeek,
    promptsLastWeek,
    avgPromptsPerDay,
    dailyActivity,
    maxDailyCount: Math.max(maxDailyCount, 1),
    platformUsage,
    categoryBreakdown,
    recentHistory: history.slice().sort((a, b) => b.timestamp - a.timestamp)
  };
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString();
}