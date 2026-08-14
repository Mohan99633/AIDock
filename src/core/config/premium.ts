/**
 * AIDock Pro — freemium plan & pricing configuration.
 *
 * Free tier keeps the core experience with limits; Pro unlocks everything.
 * The "Buy" buttons link to the external checkout the store owner configures
 * (Gumroad / Paddle / Stripe / Chrome Web Store listing). The license key the
 * checkout issues is redeemed in Settings to activate Pro on this device.
 */

export type PlanTier = 'free' | 'pro';

export const PREMIUM_STORAGE_KEY = 'aidock.premium.tier';
export const LICENSE_STORAGE_KEY = 'aidock.premium.licenseKey';
export const CHECKOUT_URL_STORAGE_KEY = 'aidock.premium.checkoutUrl';

/**
 * Set this to your real checkout URL (Gumroad product, Paddle, Stripe payment
 * link, or Chrome Web Store paid listing). When empty, the Buy buttons show a
 * "not configured" hint instead of navigating. Can also be set from Settings.
 */
export const DEFAULT_CHECKOUT_URL = '';

export const FREE_PROMPT_LIMIT = 30;
export const FREE_WORKSPACE_LIMIT = 2;

export const PRO_PRICE_LIFETIME_USD = 19.99;
export const PRO_PRICE_MONTHLY_USD = 2.99;

/** Feature keys gated behind Pro. */
export const PRO_ONLY_FEATURES = ['model-comparison'] as const;
export type ProOnlyFeature = (typeof PRO_ONLY_FEATURES)[number];

export const PLAN_META = {
  free: {
    name: 'Free',
    tagline: 'Get started',
    priceMonthlyUsd: 0,
    priceLifetimeUsd: 0
  },
  pro: {
    name: 'Pro',
    tagline: 'Unlock everything',
    priceMonthlyUsd: PRO_PRICE_MONTHLY_USD,
    priceLifetimeUsd: PRO_PRICE_LIFETIME_USD
  }
} as const;

export const FREE_INCLUDED = [
  'Up to 30 saved prompts',
  '2 workspaces',
  'Prompt Library, History & Notes',
  'Universal Search & Templates',
  'Prompt Optimizer'
] as const;

export const PRO_INCLUDED = [
  'Unlimited prompts & workspaces',
  'Model Comparison across 8+ models',
  'Full JSON backup & restore',
  'Cloud sync via Chrome',
  'Priority support & early features'
] as const;
