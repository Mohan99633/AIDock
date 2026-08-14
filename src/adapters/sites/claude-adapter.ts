import { createSiteAdapter } from '~/adapters/sites/base-site-adapter';

export const claudeAdapter = createSiteAdapter({
  id: 'claude',
  displayName: 'Claude',
  hostPatterns: ['claude.ai'],
  capabilities: {
    canInjectPrompt: true,
    canReadPrompt: true,
    canReadConversation: true
  },
  selectors: {
    promptInput: 'div[contenteditable="true"][data-testid="chat-input"]',
    sendButton: 'button[data-testid="send-button"]',
    responseContainer: 'div[data-testid="chat-message-assistant"]',
    isContentEditable: true
  }
});