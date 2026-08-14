import { describe, expect, it } from 'vitest';
import { CURATED_MODELS } from '~/features/model-comparison/data/models';
import {
  EMPTY_RUN_TEMPLATE,
  estimateCostUsd,
  formatLatency,
  formatUsd,
  summarizeComparison,
  type ModelRun
} from './comparison';

const MODEL = CURATED_MODELS[0]!;

function run(overrides: Partial<ModelRun>): ModelRun {
  return { ...EMPTY_RUN_TEMPLATE(MODEL), ...overrides };
}

describe('estimateCostUsd', () => {
  it('computes zero for zero tokens', () => {
    expect(estimateCostUsd(0, 0, MODEL)).toBe(0);
  });

  it('computes cost from prompt and completion tokens', () => {
    // 1M prompt tokens at MODEL.promptPricePer1M → that price
    expect(estimateCostUsd(1_000_000, 0, MODEL)).toBe(MODEL.promptPricePer1M);
    expect(estimateCostUsd(0, 1_000_000, MODEL)).toBe(MODEL.completionPricePer1M);
  });

  it('scales linearly for partial tokens', () => {
    const halfPrompt = MODEL.promptPricePer1M / 2;
    expect(estimateCostUsd(500_000, 0, MODEL)).toBe(halfPrompt);
  });
});

describe('summarizeComparison', () => {
  const modelA = CURATED_MODELS[0]!;
  const modelB = CURATED_MODELS[1]!;

  it('returns empty winners when there are no successful runs', () => {
    const summary = summarizeComparison([
      run({ modelId: modelA.id, status: 'error', error: 'boom' })
    ]);
    expect(summary.fastestModelId).toBeNull();
    expect(summary.cheapestModelId).toBeNull();
    expect(summary.longestModelId).toBeNull();
    expect(summary.totalTokens).toBe(0);
    expect(summary.totalCostUsd).toBe(0);
  });

  it('finds fastest, cheapest, and longest among successful runs', () => {
    const runs: ModelRun[] = [
      run({
        modelId: modelA.id,
        status: 'success',
        latencyMs: 500,
        totalTokens: 200,
        costUsd: 0.005,
        content: 'short'
      }),
      run({
        modelId: modelB.id,
        status: 'success',
        latencyMs: 1200,
        totalTokens: 400,
        costUsd: 0.001,
        content: 'a much longer response here for comparison purposes'
      })
    ];

    const summary = summarizeComparison(runs);
    expect(summary.fastestModelId).toBe(modelA.id);
    expect(summary.cheapestModelId).toBe(modelB.id);
    expect(summary.longestModelId).toBe(modelB.id);
    expect(summary.totalTokens).toBe(600);
  });

  it('ignores pending and running runs in totals', () => {
    const runs: ModelRun[] = [
      run({ modelId: modelA.id, status: 'pending' }),
      run({ modelId: modelB.id, status: 'success', totalTokens: 100, costUsd: 0.002, content: 'x', latencyMs: 10 })
    ];
    const summary = summarizeComparison(runs);
    expect(summary.totalTokens).toBe(100);
    expect(summary.fastestModelId).toBe(modelB.id);
  });
});

describe('formatLatency', () => {
  it('formats milliseconds and seconds', () => {
    expect(formatLatency(null)).toBe('—');
    expect(formatLatency(350)).toBe('350ms');
    expect(formatLatency(1200)).toBe('1.2s');
  });
});

describe('formatUsd', () => {
  it('formats null, zero, sub-cent, and cent values', () => {
    expect(formatUsd(null)).toBe('—');
    expect(formatUsd(0)).toBe('$0.00');
    expect(formatUsd(0.0001)).toBe('$0.00010');
    expect(formatUsd(0.123)).toBe('$0.123');
  });
});
