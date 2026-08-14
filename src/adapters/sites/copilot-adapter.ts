import { createSiteAdapter } from '~/adapters/sites/base-site-adapter';

export const copilotAdapter = createSiteAdapter({
  id: 'copilot',
  displayName: 'Microsoft Copilot',
  hostPatterns: ['copilot.microsoft.com'],
  capabilities: {
    canInjectPrompt: true,
    canReadPrompt: true,
    canReadConversation: true
  },
  selectors: {
    promptInput: 'div[contenteditable="true"][aria-label="Message Copilot"]',
    sendButton: 'button[aria-label="Submit"]',
    responseContainer: 'div[data-content="ai-message"]',
    isContentEditable: true
  }
});