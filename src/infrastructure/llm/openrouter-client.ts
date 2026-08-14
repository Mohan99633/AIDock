/**
 * Thin OpenRouter client used by Model Comparison.
 * OpenRouter exposes many models through a single API key.
 * Base URL: https://openrouter.ai/api/v1
 */

const OPENROUTER_API_BASE = 'https://openrouter.ai/api/v1';

export type OpenRouterMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type CompletionResponse = {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
};

type OpenRouterChatResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: { message?: string };
};

/**
 * Runs a single chat completion against OpenRouter.
 * Throws an Error with a human-readable message on failure.
 */
export async function runOpenRouterCompletion(
  apiKey: string,
  modelId: string,
  prompt: string
): Promise<CompletionResponse> {
  const res = await fetch(`${OPENROUTER_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelId,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!res.ok) {
    throw new Error(`OpenRouter request failed (${res.status}). Check your API key.`);
  }

  const json = (await res.json()) as OpenRouterChatResponse;

  if (json.error?.message) {
    throw new Error(json.error.message);
  }

  const content = json.choices?.[0]?.message?.content ?? '';
  if (!content) {
    throw new Error('OpenRouter returned an empty response.');
  }

  return {
    content,
    usage: {
      promptTokens: json.usage?.prompt_tokens ?? 0,
      completionTokens: json.usage?.completion_tokens ?? 0,
      totalTokens: json.usage?.total_tokens ?? 0
    }
  };
}

/** Verifies an API key by listing a single model. Returns true when valid. */
export async function validateOpenRouterKey(apiKey: string): Promise<boolean> {
  try {
    const res = await fetch(`${OPENROUTER_API_BASE}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    return res.ok;
  } catch {
    return false;
  }
}