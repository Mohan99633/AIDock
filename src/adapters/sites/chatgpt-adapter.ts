import { createSiteAdapter } from '~/adapters/sites/base-site-adapter';

export const chatGptAdapter = createSiteAdapter({
  id: 'chatgpt',
  displayName: 'ChatGPT',
  hostPatterns: ['chatgpt.com'],
  capabilities: {
    canInjectPrompt: true,
    canReadPrompt: true,
    canReadConversation: true
  },
  selectors: {
    promptInput: 'textarea#prompt-textarea',
    sendButton: 'button[data-testid="send-button"]',
    responseContainer: 'div[data-message-author-role="assistant"]'
  }
});
