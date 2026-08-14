import { runOpenRouterCompletion } from '~/infrastructure/llm/openrouter-client';
import type { CuratedModel } from '~/features/model-comparison/data/models';

export type ModelRunStatus = 'pending' | 'running' | 'success' | 'error';

export type ModelRun = {
  modelId: string;
  modelName: string;
  provider: CuratedModel['provider'];
  status: ModelRunStatus;
  content: string | null;
  latencyMs: number | null;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  costUsd: number | null;
  error: string | null;
};

export type ComparisonSummary = {
  totalCostUsd: number;
  totalTokens: number;
  fastestModelId: string | null;
  cheapestModelId: string | null;
  longestModelId: string | null;
};

export const EMPTY_RUN_TEMPLATE = (
  model: CuratedModel
): ModelRun => ({
  modelId: model.id,
  modelName: model.name,
  provider: model.provider,
  status: 'pending',
  content: null,
  latencyMs: null,
  promptTokens: null,
  completionTokens: null,
  totalTokens: null,
  costUsd: null,
  error: null
});

/**
 * Estimates the USD cost of a run from token usage and per-1M-token prices.
 * Clearly an estimate — real billing may differ by a few cents.
 */
export function estimateCostUsd(
  promptTokens: number,
  completionTokens: number,
  model: CuratedModel
): number {
  const promptCost = (promptTokens / 1_000_000) * model.promptPricePer1M;
  const completionCost = (completionTokens / 1_000_000) * model.completionPricePer1M;
  return Math.round((promptCost + completionCost) * 1_000_000) / 1_000_000;
}

/**
 * Runs the same prompt against every model, in parallel.
 * Calls `onProgress` after each model finishes so the UI can update live.
 */
export async function compareModels(
  apiKey: string,
  prompt: string,
  models: readonly CuratedModel[],
  onProgress: (run: ModelRun) => void
): Promise<ModelRun[]> {
  const runs = models.map(EMPTY_RUN_TEMPLATE);
  runs.forEach((run) => onProgress(run));

  await Promise.all(
    runs.map(async (run) => {
      const startedAt = performance.now();
      run.status = 'running';
      onProgress(run);
      try {
        const result = await runOpenRouterCompletion(apiKey, run.modelId, prompt);
        run.status = 'success';
        run.content = result.content;
        run.latencyMs = Math.round(performance.now() - startedAt);
        run.promptTokens = result.usage.promptTokens;
        run.completionTokens = result.usage.completionTokens;
        run.totalTokens = result.usage.totalTokens;
        const model = models.find((m) => m.id === run.modelId);
        run.costUsd = model ? estimateCostUsd(result.usage.promptTokens, result.usage.completionTokens, model) : null;
      } catch (err) {
        run.status = 'error';
        run.error = err instanceof Error ? err.message : 'Unknown error';
        run.latencyMs = Math.round(performance.now() - startedAt);
      }
      onProgress(run);
    })
  );

  return runs;
}

/**
 * Summarizes a completed comparison: totals plus the "winners" for speed, cost, and length.
 */
export function summarizeComparison(runs: readonly ModelRun[]): ComparisonSummary {
  const succeeded = runs.filter((r) => r.status === 'success' && r.totalTokens !== null && r.costUsd !== null);

  let totalCostUsd = 0;
  let totalTokens = 0;
  let fastest: ModelRun | null = null;
  let cheapest: ModelRun | null = null;
  let longest: ModelRun | null = null;

  for (const run of succeeded) {
    totalCostUsd += run.costUsd ?? 0;
    totalTokens += run.totalTokens ?? 0;

    if (run.latencyMs !== null && (fastest === null || run.latencyMs < (fastest.latencyMs ?? Infinity))) {
      fastest = run;
    }
    if (run.costUsd !== null && (cheapest === null || run.costUsd < (cheapest.costUsd ?? Infinity))) {
      cheapest = run;
    }
    const length = run.content?.length ?? 0;
    if (longest === null || length > (longest.content?.length ?? 0)) {
      longest = run;
    }
  }

  return {
    totalCostUsd: Math.round(totalCostUsd * 1_000_000) / 1_000_000,
    totalTokens,
    fastestModelId: fastest?.modelId ?? null,
    cheapestModelId: cheapest?.modelId ?? null,
    longestModelId: longest?.modelId ?? null
  };
}

/** Format milliseconds as "1.2s" or "350ms". */
export function formatLatency(ms: number | null): string {
  if (ms === null) return '—';
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

/** Format a USD cost with enough precision to show sub-cent values. */
export function formatUsd(cost: number | null): string {
  if (cost === null) return '—';
  if (cost === 0) return '$0.00';
  if (cost < 0.01) return `$${cost.toFixed(5)}`;
  return `$${cost.toFixed(3)}`;
}