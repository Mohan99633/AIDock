import { storage } from '~/infrastructure/storage/storage.service';
import type { PromptHistoryEntry } from '~/infrastructure/storage/schema';
import type { SupportedSiteId } from '~/core/contracts/site-adapter';

export type ProductivityStats = {
  totalPrompts: number;
  totalPromptsToday: number;
  totalPromptsThisWeek: number;
  totalPromptsThisMonth: number;
  totalSavedPrompts: number;
  totalNotes: number;
  totalCollections: number;
  averagePromptLength: number;
  longestPromptLength: number;
  mostUsedPlatform: SupportedSiteId | null;
  mostUsedPlatformCount: number;
  topTags: { tag: string; count: number }[];
  categoryBreakdown: { category: string; count: number }[];
  promptsByDay: { date: string; count: number }[];
  promptsByPlatform: { platform: SupportedSiteId; count: number }[];
  promptsByHour: { hour: number; count: number }[];
  productivityScore: number;
  streakDays: number;
  estimatedTokensUsed: number;
  estimatedCostUsd: number;
};

export type EmptyStats = ProductivityStats;

/**
 * Builds an empty stats record used when there's no data yet.
 */
export function buildEmptyStats(): EmptyStats {
  return {
    totalPrompts: 0,
    totalPromptsToday: 0,
    totalPromptsThisWeek: 0,
    totalPromptsThisMonth: 0,
    totalSavedPrompts: 0,
    totalNotes: 0,
    totalCollections: 0,
    averagePromptLength: 0,
    longestPromptLength: 0,
    mostUsedPlatform: null,
    mostUsedPlatformCount: 0,
    topTags: [],
    categoryBreakdown: [],
    promptsByDay: [],
    promptsByPlatform: [],
    promptsByHour: [],
    productivityScore: 0,
    streakDays: 0,
    estimatedTokensUsed: 0,
    estimatedCostUsd: 0
  };
}

const ONE_DAY_MS = 86_400_000;

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Token estimate: ~4 characters per token (English rule of thumb).
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Approximate USD cost per 1K tokens per platform (rough public estimates).
 * These are clearly estimates and may be displayed as such.
 */
const COST_PER_1K_TOKENS_USD: Record<SupportedSiteId, number> = {
  chatgpt: 0.002,
  claude: 0.003,
  gemini: 0.001,
  perplexity: 0.002,
  copilot: 0.0015,
  grok: 0.002,
  poe: 0.002,
  openrouter: 0.002
};

/**
 * Calculates a 0-100 productivity score based on prompt frequency, length,
 * variety of platforms used, and consistency.
 */
function calculateProductivityScore(
  total: number,
  platformsUsed: number,
  avgLength: number,
  streak: number
): number {
  if (total === 0) return 0;

  const frequencyScore = Math.min(total * 2, 40);
  const varietyScore = Math.min(platformsUsed * 5, 25);
  const lengthScore = avgLength >= 50 ? Math.min((avgLength - 50) / 10, 20) : 0;
  const streakScore = Math.min(streak * 2, 15);

  return Math.round(frequencyScore + varietyScore + lengthScore + streakScore);
}

/**
 * Calculates consecutive day streak from history entries.
 */
function calculateStreak(history: PromptHistoryEntry[]): number {
  if (history.length === 0) return 0;

  const dayKeys = new Set(history.map((entry) => formatDateKey(new Date(entry.timestamp))));
  let streak = 0;
  let cursor = startOfDay(new Date());

  while (dayKeys.has(formatDateKey(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - ONE_DAY_MS);
  }

  return streak;
}

/**
 * Aggregates all prompt history and library data into a single dashboard
 * stats object. Designed to be called on-demand by the popup or options UI.
 */
export async function computeProductivityStats(): Promise<ProductivityStats> {
  const [history, prompts, notes, collections] = await Promise.all([
    storage.history.getAll(),
    storage.prompts.getAll(),
    storage.notes.getAll(),
    storage.collections.getAll()
  ]);

  if (history.length === 0 && prompts.length === 0) {
    return buildEmptyStats();
  }

  const now = new Date();
  const today = startOfDay(now);
  const weekAgo = new Date(today.getTime() - 7 * ONE_DAY_MS);
  const monthAgo = new Date(today.getTime() - 30 * ONE_DAY_MS);

  let promptsToday = 0;
  let promptsThisWeek = 0;
  let promptsThisMonth = 0;
  let totalLength = 0;
  let longest = 0;
  let totalTokens = 0;
  let totalCost = 0;

  const tagCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  const platformCounts = new Map<SupportedSiteId, number>();
  const dayCounts = new Map<string, number>();
  const hourCounts = new Map<number, number>();

  for (const entry of history) {
    const date = new Date(entry.timestamp);

    if (isSameDay(date, today)) promptsToday += 1;
    if (date >= weekAgo) promptsThisWeek += 1;
    if (date >= monthAgo) promptsThisMonth += 1;

    const length = entry.promptContent.length;
    totalLength += length;
    if (length > longest) longest = length;

    for (const tag of entry.tags ?? []) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
    if (entry.category) {
      categoryCounts.set(entry.category, (categoryCounts.get(entry.category) ?? 0) + 1);
    }
    platformCounts.set(entry.aiPlatform, (platformCounts.get(entry.aiPlatform) ?? 0) + 1);

    const dayKey = formatDateKey(date);
    dayCounts.set(dayKey, (dayCounts.get(dayKey) ?? 0) + 1);

    const hour = date.getHours();
    hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);

    const tokens = estimateTokens(entry.promptContent) + estimateTokens(entry.aiResponseContent);
    totalTokens += tokens;
    totalCost += (tokens / 1000) * COST_PER_1K_TOKENS_USD[entry.aiPlatform];
  }

  // Build last-7-days array (always, even if empty).
  const promptsByDay: { date: string; count: number }[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(today.getTime() - offset * ONE_DAY_MS);
    const key = formatDateKey(day);
    promptsByDay.push({ date: key, count: dayCounts.get(key) ?? 0 });
  }

  const promptsByPlatform: { platform: SupportedSiteId; count: number }[] = Array.from(
    platformCounts.entries()
  )
    .map(([platform, count]) => ({ platform, count }))
    .sort((a, b) => b.count - a.count);

  const topPlatform = promptsByPlatform[0];

  const promptsByHour: { hour: number; count: number }[] = [];
  for (let h = 0; h < 24; h += 1) {
    promptsByHour.push({ hour: h, count: hourCounts.get(h) ?? 0 });
  }

  const topTags = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const categoryBreakdown = Array.from(categoryCounts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  const streak = calculateStreak(history);
  const avgLength = history.length === 0 ? 0 : Math.round(totalLength / history.length);

  return {
    totalPrompts: history.length,
    totalPromptsToday: promptsToday,
    totalPromptsThisWeek: promptsThisWeek,
    totalPromptsThisMonth: promptsThisMonth,
    totalSavedPrompts: prompts.length,
    totalNotes: notes.length,
    totalCollections: collections.length,
    averagePromptLength: avgLength,
    longestPromptLength: longest,
    mostUsedPlatform: topPlatform?.platform ?? null,
    mostUsedPlatformCount: topPlatform?.count ?? 0,
    topTags,
    categoryBreakdown,
    promptsByDay,
    promptsByPlatform,
    promptsByHour,
    productivityScore: calculateProductivityScore(
      history.length,
      platformCounts.size,
      avgLength,
      streak
    ),
    streakDays: streak,
    estimatedTokensUsed: totalTokens,
    estimatedCostUsd: Math.round(totalCost * 1000) / 1000
  };
}
