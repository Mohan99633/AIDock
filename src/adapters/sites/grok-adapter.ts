import { createSiteAdapter } from '~/adapters/sites/base-site-adapter';

export const grokAdapter = createSiteAdapter({
  id: 'grok',
  displayName: 'Grok',
  hostPatterns: ['grok.com'],
  capabilities: {
    canInjectPrompt: true,
    canReadPrompt: true,
    canReadConversation: true
  },
  selectors: {
    promptInput: 'textarea[placeholder*="Ask"]',
    sendButton: 'button[aria-label="Send message"]',
    responseContainer: 'div[data-testid="chat-message"]'
  }
});