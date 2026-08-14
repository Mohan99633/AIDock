import { createSiteAdapter } from '~/adapters/sites/base-site-adapter';

export const geminiAdapter = createSiteAdapter({
  id: 'gemini',
  displayName: 'Gemini',
  hostPatterns: ['gemini.google.com'],
  capabilities: {
    canInjectPrompt: true,
    canReadPrompt: true,
    canReadConversation: true
  },
  selectors: {
    promptInput: 'div[contenteditable="true"][data-test-id="user-input"]',
    sendButton: 'button[aria-label="Send message"]',
    responseContainer: 'model-response',
    isContentEditable: true
  }
});