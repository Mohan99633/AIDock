import { describe, expect, it } from 'vitest';
import { CURATED_MODELS, getCuratedModelById } from './models';

describe('curated models catalog', () => {
  it('has unique ids', () => {
    const ids = CURATED_MODELS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers several providers', () => {
    const providers = new Set(CURATED_MODELS.map((m) => m.provider));
    expect(providers.size).toBeGreaterThanOrEqual(4);
  });

  it('all prices are non-negative numbers', () => {
    for (const m of CURATED_MODELS) {
      expect(m.promptPricePer1M).toBeGreaterThanOrEqual(0);
      expect(m.completionPricePer1M).toBeGreaterThanOrEqual(0);
    }
  });

  it('returns the model for a known id and undefined otherwise', () => {
    expect(getCuratedModelById(CURATED_MODELS[0]!.id)).toBeDefined();
    expect(getCuratedModelById('not-a-real-model')).toBeUndefined();
  });
});
