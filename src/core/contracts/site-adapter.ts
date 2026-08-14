export type SupportedSiteId =
  | 'chatgpt'
  | 'claude'
  | 'gemini'
  | 'perplexity'
  | 'copilot'
  | 'grok'
  | 'poe'
  | 'openrouter';

export type SiteCapabilities = {
  readonly canInjectPrompt: boolean;
  readonly canReadPrompt: boolean;
  readonly canReadConversation: boolean;
};

export type SiteSelectors = {
  /** Selector for the prompt input element (e.g. textarea or contenteditable). */
  readonly promptInput: string;
  /** Selector for the send button. */
  readonly sendButton: string;
  /** Selector that matches conversation response messages. */
  readonly responseContainer: string;
  /** Set to true when the prompt input is a contenteditable element. */
  readonly isContentEditable?: boolean;
};

export type AiSiteAdapter = {
  readonly id: SupportedSiteId;
  readonly displayName: string;
  readonly hostPatterns: readonly string[];
  readonly capabilities: SiteCapabilities;
  readonly selectors: SiteSelectors;
  matchesHost(hostname: string): boolean;

  /**
   * Reads the current text from the AI's input field.
   */
  readPrompt(): Promise<string | null>;

  /**
   * Writes text into the AI's input field and triggers a change event.
   */
  writePrompt(text: string): Promise<void>;

  /**
   * Clicks the 'Send' button of the AI interface.
   */
  clickSend(): Promise<void>;

  /**
   * Reads the last response received from the AI.
   */
  readLastResponse(): Promise<string | null>;
};
