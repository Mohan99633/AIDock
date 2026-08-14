import { createSiteAdapter } from '~/adapters/sites/base-site-adapter';

export const perplexityAdapter = createSiteAdapter({
  id: 'perplexity',
  displayName: 'Perplexity',
  hostPatterns: ['perplexity.ai', 'www.perplexity.ai'],
  capabilities: {
    canInjectPrompt: true,
    canReadPrompt: true,
    canReadConversation: true
  },
  selectors: {
    promptInput: 'textarea[placeholder*="Ask"]',
    sendButton: 'button[aria-label="Submit"]',
    responseContainer: 'div[data-testid="thread-answer"]'
  }
});