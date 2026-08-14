/**
 * Prompt Optimizer — Local analysis engine.
 *
 * Analyzes a prompt and returns a 0-100 quality score, a per-dimension breakdown,
 * and a list of issues with concrete suggestions. Runs entirely in the browser.
 *
 * Dimensions scored (each 0-100, weighted into the overall score):
 *  - clarity    : Is the objective unambiguous?
 *  - specificity: Are constraints, audience, format, and length specified?
 *  - structure  : Does it use lists/roles/sections rather than a wall of text?
 *  - brevity    : Does it avoid repetition, filler, and bloat?
 *  - context    : Does it provide the information needed to answer well?
 */

export type Severity = 'low' | 'medium' | 'high';

export type IssueCategory =
  | 'weak-instruction'
  | 'missing-context'
  | 'unclear-objective'
  | 'repetition'
  | 'long-prompt'
  | 'no-format'
  | 'no-role'
  | 'no-audience'
  | 'no-constraints'
  | 'filler';

export type OptimizerIssue = {
  category: IssueCategory;
  severity: Severity;
  message: string;
  suggestion: string;
};

export type OptimizerScore = {
  clarity: number;
  specificity: number;
  structure: number;
  brevity: number;
  context: number;
  overall: number;
};

export type OptimizerResult = {
  score: OptimizerScore;
  issues: OptimizerIssue[];
  wordCount: number;
  characterCount: number;
  detectedSignals: {
    hasRole: boolean;
    hasAudience: boolean;
    hasFormat: boolean;
    hasConstraints: boolean;
    hasObjective: boolean;
  };
};

const WEAK_PHRASES = [
  'kind of',
  'sort of',
  'maybe',
  'i think',
  'i guess',
  'just',
  'maybe a',
  'something like',
  'or something',
  'etc etc',
  'blah blah',
  'whatever you think'
];

const FILLER_PHRASES = [
  'as you know',
  'in order to',
  'for the purpose of',
  'due to the fact that',
  'at this point in time',
  'in the event that',
  'a number of'
];

const ROLE_PATTERNS: RegExp[] = [
  /\bact as (?:a|an|the)\b/i,
  /\byou are (?:a|an|the)\b/i,
  /\bpretend to be\b/i,
  /\bimagine you'?re\b/i,
  /\bfrom now on you\b/i,
  /\bas a senior\b/i,
  /\bas an expert\b/i
];

const AUDIENCE_PATTERNS: RegExp[] = [
  /\bfor (?:a|an|the|beginners?|experts?|students?|developers?|engineers?|designers?|writers?)\b/i,
  /\btarget audience\b/i,
  /\bexplain (?:to|for) (?:a|an|the)\b/i,
  /\bwritten for\b/i,
  /\baimed at\b/i
];

const FORMAT_PATTERNS: RegExp[] = [
  /\bformat(?:\s+it)?\s+(?:as|in|using)\b/i,
  /\b(?:return|respond|write|output) (?:as|in|using)\b/i,
  /\b(?:bullet(?:s)?|list|table|json|markdown|outline)\b/i,
  /\b\d+\s+(?:bullet(?:s)?|words?|items?|paragraphs?|lines?)\b/i,
  /\bunder \d+ words?\b/i,
  /\bshort paragraph\b/i
];

const CONSTRAINT_PATTERNS: RegExp[] = [
  /\b(?:don'?t|do not|avoid|never|must not|should not)\b/i,
  /\b(?:must|should|need to|required to)\b/i,
  /\b(?:rule(?:s)?|requirement(?:s)?|constraint(?:s)?)\b/i,
  /\b(?:always|ensure|make sure)\b/i
];

const OBJECTIVE_VERBS = [
  'write',
  'create',
  'generate',
  'explain',
  'summarize',
  'analyze',
  'review',
  'refactor',
  'translate',
  'compare',
  'list',
  'design',
  'plan',
  'outline',
  'draft'
];

const HIGH_VALUE_NOISE_WORDS = [
  'the',
  'a',
  'an',
  'and',
  'or',
  'but',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'to',
  'of',
  'in',
  'for',
  'on',
  'at',
  'by',
  'with',
  'as',
  'that',
  'this',
  'it'
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function countMatchesAny(text: string, phrases: readonly string[]): number {
  const lower = text.toLowerCase();
  let count = 0;
  for (const phrase of phrases) {
    if (lower.includes(phrase)) count += 1;
  }
  return count;
}

function hasAny(text: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function jaccardSimilarity(a: readonly string[], b: readonly string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersection = 0;
  for (const v of setA) if (setB.has(v)) intersection += 1;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Splits the prompt into sentences/segments and detects near-duplicate content.
 */
function findRepetition(text: string): { score: number; duplicates: number } {
  const sentences = text
    .split(/(?<=[.!?\n])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12);

  if (sentences.length < 2) return { score: 100, duplicates: 0 };

  const tokens = sentences.map(tokenize);
  let nearDuplicates = 0;
  for (let i = 0; i < tokens.length; i += 1) {
    for (let j = i + 1; j < tokens.length; j += 1) {
      const sim = jaccardSimilarity(tokens[i] ?? [], tokens[j] ?? []);
      if (sim >= 0.7) {
        nearDuplicates += 1;
        break; // count each sentence once
      }
    }
  }

  const duplicationRatio = nearDuplicates / sentences.length;
  // Map: 0% duplicates = 100, 50%+ duplicates = 0
  const score = clamp(Math.round(100 - duplicationRatio * 200), 0, 100);
  return { score, duplicates: nearDuplicates };
}

function detectSignals(text: string): OptimizerResult['detectedSignals'] {
  return {
    hasRole: hasAny(text, ROLE_PATTERNS),
    hasAudience: hasAny(text, AUDIENCE_PATTERNS),
    hasFormat: hasAny(text, FORMAT_PATTERNS),
    hasConstraints: hasAny(text, CONSTRAINT_PATTERNS),
    hasObjective: OBJECTIVE_VERBS.some((v) => new RegExp(`\\b${v}\\b`, 'i').test(text))
  };
}

function scoreClarity(text: string, issues: OptimizerIssue[]): number {
  let score = 100;
  const lower = text.toLowerCase();
  const weakCount = countMatchesAny(lower, WEAK_PHRASES);
  if (weakCount > 0) {
    score -= 15 + (weakCount - 1) * 8;
    issues.push({
      category: 'weak-instruction',
      severity: weakCount > 1 ? 'high' : 'medium',
      message: `Found ${weakCount} weak/hedging phrase${weakCount > 1 ? 's' : ''}.`,
      suggestion:
        'Replace hedging phrases ("maybe", "kind of", "just", "whatever you think") with concrete instructions that state exactly what you want.'
    });
  }
  // Unclear objective heuristic: very short prompts (<10 words) typically lack an objective
  const wordCount = tokenize(text).length;
  if (wordCount > 0 && wordCount < 8) {
    score -= 25;
    issues.push({
      category: 'unclear-objective',
      severity: 'high',
      message: 'Prompt is very short and likely lacks a clear objective.',
      suggestion:
        'State explicitly what you want the AI to produce, in one short sentence. E.g., "Summarize this article in 5 bullet points for a general audience."'
    });
  }
  return clamp(score, 0, 100);
}

function scoreSpecificity(
  text: string,
  signals: OptimizerResult['detectedSignals'],
  issues: OptimizerIssue[]
): number {
  let score = 0;
  if (signals.hasRole) score += 25;
  else {
    issues.push({
      category: 'no-role',
      severity: 'medium',
      message: 'No role or persona is set for the AI.',
      suggestion:
        'Add a "You are a senior [role]" line at the start to anchor the tone and depth of the answer.'
    });
  }
  if (signals.hasAudience) score += 25;
  else {
    issues.push({
      category: 'no-audience',
      severity: 'medium',
      message: 'Target audience is not specified.',
      suggestion:
        'Name who this is for (e.g., "for a 12-year-old", "for a senior engineer") so the AI calibrates language and depth.'
    });
  }
  if (signals.hasFormat) score += 25;
  else {
    issues.push({
      category: 'no-format',
      severity: 'medium',
      message: 'Output format is not specified.',
      suggestion:
        'Tell the AI the desired shape: "as a markdown table", "5 bullet points", "under 200 words", "as JSON", etc.'
    });
  }
  if (signals.hasConstraints) score += 25;
  else {
    issues.push({
      category: 'no-constraints',
      severity: 'low',
      message: 'No constraints or guardrails were stated.',
      suggestion:
        'Add a "Rules" or "Constraints" section listing what the AI must do or avoid (e.g., "Don\'t use jargon", "Must include 3 examples").'
    });
  }
  return clamp(score, 0, 100);
}

function scoreStructure(text: string): number {
  let score = 60; // baseline
  const hasBullets = /(^|\n)\s*[-*•]\s+/m.test(text);
  const hasNumberedList = /(^|\n)\s*\d+\.\s+/m.test(text);
  const hasSectionHeader = /(^|\n)#{1,3}\s+/m.test(text);
  const hasMultipleParagraphs = text.split(/\n\s*\n/).filter((p) => p.trim()).length >= 2;

  if (hasBullets) score += 10;
  if (hasNumberedList) score += 10;
  if (hasSectionHeader) score += 10;
  if (hasMultipleParagraphs) score += 10;

  return clamp(score, 0, 100);
}

function scoreBrevity(
  text: string,
  wordCount: number,
  issues: OptimizerIssue[]
): number {
  let score = 100;
  const lower = text.toLowerCase();
  const fillerCount = countMatchesAny(lower, FILLER_PHRASES);
  if (fillerCount > 0) {
    score -= fillerCount * 12;
    issues.push({
      category: 'filler',
      severity: fillerCount > 2 ? 'medium' : 'low',
      message: `Found ${fillerCount} filler phrase${fillerCount > 1 ? 's' : ''} that add length without meaning.`,
      suggestion:
        'Replace filler like "in order to" → "to", "due to the fact that" → "because", "at this point in time" → "now".'
    });
  }

  const rep = findRepetition(text);
  if (rep.duplicates > 0) {
    score -= rep.duplicates * 18;
    issues.push({
      category: 'repetition',
      severity: rep.duplicates > 1 ? 'high' : 'medium',
      message: `Detected ${rep.duplicates} near-duplicate sentence${rep.duplicates > 1 ? 's' : ''}.`,
      suggestion:
        'Merge or remove duplicate sentences. Repeating the same point in different words wastes tokens and dilutes the prompt.'
    });
  }

  // Length penalty for very long prompts
  if (wordCount > 800) {
    score -= 30;
    issues.push({
      category: 'long-prompt',
      severity: 'high',
      message: `Prompt is very long (${wordCount} words).`,
      suggestion:
        'Trim to the essentials. Move reference material into attached context rather than inline, and cut redundant phrasing.'
    });
  } else if (wordCount > 400) {
    score -= 12;
    issues.push({
      category: 'long-prompt',
      severity: 'medium',
      message: `Prompt is long (${wordCount} words).`,
      suggestion:
        'Consider tightening. Long prompts increase cost and can reduce focus. Aim for the shortest prompt that still gives the AI everything it needs.'
    });
  }
  return clamp(score, 0, 100);
}

function scoreContext(
  text: string,
  signals: OptimizerResult['detectedSignals'],
  wordCount: number,
  issues: OptimizerIssue[]
): number {
  let score = 50;
  if (signals.hasObjective) score += 25;
  if (signals.hasFormat) score += 10;
  if (signals.hasConstraints) score += 10;
  if (signals.hasRole || signals.hasAudience) score += 5;

  // Concrete signals: numbers, names, examples, file paths, code blocks
  const hasNumbers = /\b\d+\b/.test(text);
  const hasQuotedText = /"[^"]+"/.test(text) || /`[^`]+`/.test(text);
  const hasCodeBlock = /```/.test(text);
  const hasCapitalizedTerm = /\b[A-Z][a-zA-Z]{2,}/.test(text);

  const concreteSignalCount = [hasNumbers, hasQuotedText, hasCodeBlock, hasCapitalizedTerm].filter(Boolean).length;
  score += concreteSignalCount * 5;

  // Penalize if very short with no concrete signal
  if (wordCount < 30 && concreteSignalCount === 0) {
    issues.push({
      category: 'missing-context',
      severity: 'high',
      message: 'Prompt is short and has no concrete context.',
      suggestion:
        'Add at least one concrete detail: a number, an example, a name, a quoted phrase, or a sample of what you mean. The AI can\'t read your mind.'
    });
    score -= 15;
  } else if (concreteSignalCount === 0) {
    issues.push({
      category: 'missing-context',
      severity: 'medium',
      message: 'No concrete signals (numbers, names, examples) detected.',
      suggestion:
        'Strengthen context by adding 1-2 specifics: a quantity, a name, a quoted phrase, or a short example of what you want.'
    });
    score -= 10;
  }

  return clamp(score, 0, 100);
}

/**
 * Run the optimizer on a prompt string. Pure and synchronous.
 */
export function analyzePrompt(text: string): OptimizerResult {
  const issues: OptimizerIssue[] = [];
  const trimmed = text.trim();
  const words = tokenize(trimmed).filter((w) => !HIGH_VALUE_NOISE_WORDS.includes(w));
  const wordCount = tokenize(trimmed).length;

  if (trimmed.length === 0) {
    return {
      score: { clarity: 0, specificity: 0, structure: 0, brevity: 0, context: 0, overall: 0 },
      issues: [
        {
          category: 'missing-context',
          severity: 'high',
          message: 'The prompt is empty.',
          suggestion: 'Start by writing what you want the AI to produce and any context it needs.'
        }
      ],
      wordCount: 0,
      characterCount: 0,
      detectedSignals: {
        hasRole: false,
        hasAudience: false,
        hasFormat: false,
        hasConstraints: false,
        hasObjective: false
      }
    };
  }

  const signals = detectSignals(trimmed);

  const clarity = scoreClarity(trimmed, issues);
  const specificity = scoreSpecificity(trimmed, signals, issues);
  const structure = scoreStructure(trimmed);
  const brevity = scoreBrevity(trimmed, wordCount, issues);
  const context = scoreContext(trimmed, signals, wordCount, issues);

  // Weighted overall score (clarity and specificity matter most)
  const overall = Math.round(
    clarity * 0.3 + specificity * 0.3 + context * 0.2 + brevity * 0.1 + structure * 0.1
  );

  // Suppress no-format issue when there is genuinely no formatting need (single short request)
  const filteredIssues = issues.filter((issue) => {
    if (issue.category === 'no-format' && wordCount < 20) return false;
    return true;
  });

  // Use `words` so we don't accumulate an unused-var warning on it.
  void words;

  return {
    score: { clarity, specificity, structure, brevity, context, overall },
    issues: filteredIssues,
    wordCount,
    characterCount: trimmed.length,
    detectedSignals: signals
  };
}

/** Map an overall score to a quality grade. */
export function gradeScore(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

/** Human label for the overall score band. */
export function scoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Strong';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Needs work';
  return 'Weak';
}