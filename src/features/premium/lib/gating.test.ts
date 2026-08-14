import { describe, expect, it } from 'vitest';
import {
  canAddPrompt,
  canAddWorkspace,
  freeUsageSummary,
  isPro,
  isProOnlyFeature,
  promptLimitFor,
  promptsRemaining,
  proFeatureLabel,
  workspaceLimitFor
} from './gating';
import { FREE_PROMPT_LIMIT, FREE_WORKSPACE_LIMIT } from '~/core/config/premium';

describe('plan limits', () => {
  it('free tier has the configured finite limits', () => {
    expect(promptLimitFor('free')).toBe(FREE_PROMPT_LIMIT);
    expect(workspaceLimitFor('free')).toBe(FREE_WORKSPACE_LIMIT);
  });

  it('pro tier is unlimited', () => {
    expect(promptLimitFor('pro')).toBeNull();
    expect(workspaceLimitFor('pro')).toBeNull();
  });
});

describe('canAddPrompt', () => {
  it('free tier is capped at the limit', () => {
    expect(canAddPrompt('free', 0)).toBe(true);
    expect(canAddPrompt('free', FREE_PROMPT_LIMIT - 1)).toBe(true);
    expect(canAddPrompt('free', FREE_PROMPT_LIMIT)).toBe(false);
    expect(canAddPrompt('free', 999)).toBe(false);
  });

  it('pro tier is never blocked', () => {
    expect(canAddPrompt('pro', 0)).toBe(true);
    expect(canAddPrompt('pro', 9999)).toBe(true);
  });
});

describe('canAddWorkspace', () => {
  it('free tier is capped at the workspace limit', () => {
    expect(canAddWorkspace('free', FREE_WORKSPACE_LIMIT - 1)).toBe(true);
    expect(canAddWorkspace('free', FREE_WORKSPACE_LIMIT)).toBe(false);
  });

  it('pro tier is never blocked', () => {
    expect(canAddWorkspace('pro', 100)).toBe(true);
  });
});

describe('promptsRemaining', () => {
  it('returns remaining count for free tier', () => {
    expect(promptsRemaining('free', 0)).toBe(FREE_PROMPT_LIMIT);
    expect(promptsRemaining('free', 10)).toBe(FREE_PROMPT_LIMIT - 10);
  });

  it('clamps at zero', () => {
    expect(promptsRemaining('free', FREE_PROMPT_LIMIT + 50)).toBe(0);
  });

  it('returns null for unlimited pro', () => {
    expect(promptsRemaining('pro', 10)).toBeNull();
  });
});

describe('isPro / isProOnlyFeature', () => {
  it('detects pro tier', () => {
    expect(isPro('pro')).toBe(true);
    expect(isPro('free')).toBe(false);
  });

  it('model comparison is locked for free and unlocked for pro', () => {
    expect(isProOnlyFeature('free', 'model-comparison')).toBe(true);
    expect(isProOnlyFeature('pro', 'model-comparison')).toBe(false);
  });

  it('labels pro-only features', () => {
    expect(proFeatureLabel('model-comparison')).toBe('Model Comparison');
  });
});

describe('freeUsageSummary', () => {
  it('shows remaining counts for free users', () => {
    expect(freeUsageSummary('free', 10, 1)).toBe(
      `${FREE_PROMPT_LIMIT - 10} prompts left · ${FREE_WORKSPACE_LIMIT - 1} workspaces left`
    );
  });

  it('shows Unlimited for pro users', () => {
    expect(freeUsageSummary('pro', 10, 1)).toBe('Unlimited');
  });

  it('shows Limits reached when at capacity', () => {
    expect(freeUsageSummary('free', FREE_PROMPT_LIMIT, FREE_WORKSPACE_LIMIT)).toBe('Limits reached');
  });
});
