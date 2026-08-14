import {
  FREE_PROMPT_LIMIT,
  FREE_WORKSPACE_LIMIT,
  type PlanTier,
  type ProOnlyFeature
} from '~/core/config/premium';

/** True when the device has an active Pro license. */
export function isPro(tier: PlanTier): boolean {
  return tier === 'pro';
}

/** Returns the max prompts a tier may save (null = unlimited). */
export function promptLimitFor(tier: PlanTier): number | null {
  return tier === 'pro' ? null : FREE_PROMPT_LIMIT;
}

/** Returns the max workspaces a tier may create (null = unlimited). */
export function workspaceLimitFor(tier: PlanTier): number | null {
  return tier === 'pro' ? null : FREE_WORKSPACE_LIMIT;
}

/** True when a tier can still add a prompt given the current saved count. */
export function canAddPrompt(tier: PlanTier, currentCount: number): boolean {
  const limit = promptLimitFor(tier);
  return limit === null || currentCount < limit;
}

/** True when a tier can still create a workspace given the current count. */
export function canAddWorkspace(tier: PlanTier, currentCount: number): boolean {
  const limit = workspaceLimitFor(tier);
  return limit === null || currentCount < limit;
}

/** Remaining free capacity: an absolute number, or null when unlimited. */
export function promptsRemaining(tier: PlanTier, currentCount: number): number | null {
  const limit = promptLimitFor(tier);
  return limit === null ? null : Math.max(0, limit - currentCount);
}

/** True when a Pro-only feature is currently locked for this tier. */
export function isProOnlyFeature(tier: PlanTier, feature: ProOnlyFeature): boolean {
  // Every feature currently in PRO_ONLY_FEATURES is unlocked by Pro.
  return !isPro(tier);
}

/** Human label for the feature gate used in upgrade UI. */
export function proFeatureLabel(feature: ProOnlyFeature): string {
  switch (feature) {
    case 'model-comparison':
      return 'Model Comparison';
  }
}

/**
 * Builds a compact "n prompts left · n workspaces left" usage string,
 * or "Unlimited" for Pro users.
 */
export function freeUsageSummary(
  tier: PlanTier,
  promptCount: number,
  workspaceCount: number
): string {
  if (isPro(tier)) return 'Unlimited';

  const promptRemaining = promptsRemaining(tier, promptCount);
  const wsLimit = workspaceLimitFor(tier);
  const workspaceRemaining =
    wsLimit === null ? null : Math.max(0, wsLimit - workspaceCount);

  const parts: string[] = [];
  if (promptRemaining !== null && promptRemaining > 0) parts.push(`${promptRemaining} prompts left`);
  if (workspaceRemaining !== null && workspaceRemaining > 0) parts.push(`${workspaceRemaining} workspaces left`);
  // Finite limits apply but both are exhausted:
  return parts.length > 0
    ? parts.join(' · ')
    : 'Limits reached';
}
