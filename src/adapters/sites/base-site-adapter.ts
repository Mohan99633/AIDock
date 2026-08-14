import type { AiSiteAdapter, SiteCapabilities, SupportedSiteId } from '~/core/contracts/site-adapter';

/**
 * CSS selectors used to locate the DOM elements of an AI site.
 * These may need adjustment as the underlying sites change their layout.
 */
export type SiteSelectors = {
  /** Selector for the prompt input element (e.g. textarea or contenteditable). */
  readonly promptInput: string;
  /** Selector for the send button. */
  readonly sendButton: string;
  /** Selector that matches conversation response messages. */
  readonly responseContainer: string;
  /**
   * Set to true when the prompt input is a contenteditable element
   * (uses textContent / input events) rather than a form <textarea>.
   */
  readonly isContentEditable?: boolean;
};

type SiteAdapterInput = {
  id: SupportedSiteId;
  displayName: string;
  hostPatterns: readonly string[];
  capabilities: SiteCapabilities;
  selectors: SiteSelectors;
};

/**
 * Creates a site adapter with shared host matching behavior and DOM-based
 * prompt injection/extraction logic. This code is expected to run in the
 * context of a content script living on the matching AI site.
 */
export function createSiteAdapter(input: SiteAdapterInput): AiSiteAdapter {
  return {
    ...input,
    capabilities: input.capabilities,
    matchesHost(hostname: string): boolean {
      return input.hostPatterns.some((pattern) => hostname.endsWith(pattern));
    },

    async readPrompt(): Promise<string | null> {
      const el = document.querySelector<HTMLElement>(input.selectors.promptInput);
      if (!el) return null;
      if (input.selectors.isContentEditable) {
        return el.textContent ?? null;
      }
      return (el as HTMLTextAreaElement).value ?? null;
    },

    async writePrompt(text: string): Promise<void> {
      const el = document.querySelector<HTMLElement>(input.selectors.promptInput);
      if (!el) return;

      if (input.selectors.isContentEditable) {
        el.focus();
        el.textContent = text;
        el.dispatchEvent(new InputEvent('input', { bubbles: true, data: text }));
      } else {
        const textarea = el as HTMLTextAreaElement;
        textarea.value = text;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
      }
    },

    async clickSend(): Promise<void> {
      const el = document.querySelector<HTMLElement>(input.selectors.sendButton);
      el?.click();
    },

    async readLastResponse(): Promise<string | null> {
      const nodes = document.querySelectorAll<HTMLElement>(input.selectors.responseContainer);
      if (nodes.length === 0) return null;
      return nodes[nodes.length - 1]?.innerText ?? null;
    }
  };
}
