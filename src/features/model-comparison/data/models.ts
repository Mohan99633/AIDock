/**
 * Curated model catalog for AIDock's Model Comparison.
 *
 * `id` is the OpenRouter model slug used when calling the API.
 * Prices are per-1M-tokens estimates in USD (prompt/completion) used to
 * estimate comparison cost. These are approximate reference values — the
 * live API usage response is the source of truth for exact cost.
 */

export type CuratedModel = {
  id: string;
  name: string;
  provider: 'OpenAI' | 'Anthropic' | 'Google' | 'Meta' | 'DeepSeek' | 'Mistral' | 'xAI';
  promptPricePer1M: number;
  completionPricePer1M: number;
  /** Rough descriptor shown to users when picking models. */
  description: string;
};

export const CURATED_MODELS: readonly CuratedModel[] = [
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    promptPricePer1M: 0.15,
    completionPricePer1M: 0.6,
    description: 'Fast, low-cost workhorse for most everyday prompts.'
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    promptPricePer1M: 2.5,
    completionPricePer1M: 10,
    description: 'Strong general reasoning at moderate cost.'
  },
  {
    id: 'anthropic/claude-3-5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    promptPricePer1M: 0.8,
    completionPricePer1M: 4,
    description: 'Anthropic’s fast, affordable model.'
  },
  {
    id: 'anthropic/claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    promptPricePer1M: 3,
    completionPricePer1M: 15,
    description: 'Premium reasoning and writing quality.'
  },
  {
    id: 'google/gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    promptPricePer1M: 0.1,
    completionPricePer1M: 0.4,
    description: 'Very cheap and quick for high-volume work.'
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B',
    provider: 'Meta',
    promptPricePer1M: 0.12,
    completionPricePer1M: 0.3,
    description: 'Open-weight model, good value for money.'
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    promptPricePer1M: 0.27,
    completionPricePer1M: 1.1,
    description: 'Strong reasoning at a very low price.'
  },
  {
    id: 'mistralai/mistral-large',
    name: 'Mistral Large',
    provider: 'Mistral',
    promptPricePer1M: 2,
    completionPricePer1M: 6,
    description: 'European flagship for multilingual reasoning.'
  }
];

export function getCuratedModelById(id: string): CuratedModel | undefined {
  return CURATED_MODELS.find((m) => m.id === id);
}