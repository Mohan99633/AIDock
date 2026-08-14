import { createSiteAdapter } from '~/adapters/sites/base-site-adapter';

export const poeAdapter = createSiteAdapter({
  id: 'poe',
  displayName: 'Poe',
  hostPatterns: ['poe.com'],
  capabilities: {
    canInjectPrompt: true,
    canReadPrompt: true,
    canReadConversation: true
  },
  selectors: {
    promptInput: 'textarea[placeholder*="Ask"]',
    sendButton: 'button[aria-label="Send message"]',
    responseContainer: 'div[data-testid="bot-message"]'
  }
});