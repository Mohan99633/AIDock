import type { AiSiteAdapter } from '~/core/contracts/site-adapter';

import { chatGptAdapter } from '~/adapters/sites/chatgpt-adapter';
import { claudeAdapter } from '~/adapters/sites/claude-adapter';
import { copilotAdapter } from '~/adapters/sites/copilot-adapter';
import { geminiAdapter } from '~/adapters/sites/gemini-adapter';
import { grokAdapter } from '~/adapters/sites/grok-adapter';
import { openRouterAdapter } from '~/adapters/sites/openrouter-adapter';
import { perplexityAdapter } from '~/adapters/sites/perplexity-adapter';
import { poeAdapter } from '~/adapters/sites/poe-adapter';

const SUPPORTED_SITE_ADAPTERS: readonly AiSiteAdapter[] = [
  chatGptAdapter,
  claudeAdapter,
  geminiAdapter,
  perplexityAdapter,
  copilotAdapter,
  grokAdapter,
  poeAdapter,
  openRouterAdapter
];

/**
 * Returns adapters for all currently supported AI sites.
 */
export function getAllSiteAdapters(): readonly AiSiteAdapter[] {
  return SUPPORTED_SITE_ADAPTERS;
}

/**
 * Resolves an adapter by hostname.
 */
export function resolveSiteAdapterByHost(hostname: string): AiSiteAdapter | null {
  const normalizedHost = hostname.trim().toLowerCase();
  return SUPPORTED_SITE_ADAPTERS.find((adapter) => adapter.matchesHost(normalizedHost)) ?? null;
}
