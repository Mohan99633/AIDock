import { createSiteAdapter } from '~/adapters/sites/base-site-adapter';

export const openRouterAdapter = createSiteAdapter({
  id: 'openrouter',
  displayName: 'OpenRouter',
  hostPatterns: ['openrouter.ai'],
  capabilities: {
    canInjectPrompt: true,
    canReadPrompt: true,
    canReadConversation: true
  },
  selectors: {
    promptInput: 'textarea[id="chat-input"]',
    sendButton: 'button[data-testid="send-button"]',
    responseContainer: 'div[data-message-author-role="assistant"]'
  }
});