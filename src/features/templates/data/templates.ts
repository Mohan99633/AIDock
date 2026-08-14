/**
 * Built-in prompt template catalog.
 * Each template is a reusable prompt with optional {{variable}} placeholders
 * that the UI lets users fill in before saving to their library.
 */

export const TEMPLATE_CATEGORIES = [
  'Resume',
  'Coding',
  'Research',
  'Business',
  'Marketing',
  'Study',
  'AI Agents',
  'Writing',
  'Emails'
] as const;

export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

export interface PromptTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  content: string;
  tags: string[];
}

export const TEMPLATES: readonly PromptTemplate[] = [
  // ─── Resume ─────────────────────────────────────────────────────────────
  {
    id: 'resume-bullet-rewriter',
    name: 'Resume Bullet Point Rewriter',
    category: 'Resume',
    description: 'Turns weak, passive job descriptions into strong, quantified achievements.',
    tags: ['resume', 'achievement', 'quantify'],
    content: [
      'Act as a senior career coach. Rewrite the following resume bullet points to be more impactful.',
      '',
      'Rules:',
      '- Start each bullet with a strong action verb.',
      '- Quantify results wherever possible (%, $, time saved).',
      '- Focus on outcomes and impact, not responsibilities.',
      '- Keep each bullet under 2 lines.',
      '- Remove buzzwords and filler words.',
      '',
      'Original bullet points:',
      '{{bullets}}',
      '',
      'Return the rewritten bullets as a list, with one-line explanations of the improvement for each.'
    ].join('\n')
  },
  {
    id: 'cover-letter-generator',
    name: 'Cover Letter Generator',
    category: 'Resume',
    description: 'Writes a tailored cover letter from a job description and your background.',
    tags: ['cover-letter', 'job', 'tailored'],
    content: [
      'Write a professional cover letter for the following job.',
      '',
      'Job description:',
      '{{job_description}}',
      '',
      'My background (key points):',
      '{{background}}',
      '',
      'Requirements:',
      '- Opening paragraph that names the role and hooks the reader.',
      '- Body paragraphs that map my experience to their top 2-3 needs.',
      '- A closing that invites a conversation.',
      '- Tone: confident, warm, and concise. No clichés.',
      '- Length: ~300 words.'
    ].join('\n')
  },
  {
    id: 'interview-coach',
    name: 'Interview Preparation Coach',
    category: 'Resume',
    description: 'Generates realistic interview questions and model answers for a role.',
    tags: ['interview', 'practice', 'questions'],
    content: [
      'Act as my interview coach. For the role below, generate 10 realistic interview questions.',
      '',
      'Role: {{role}}',
      'My background: {{background}}',
      '',
      'For each question:',
      '1. The exact question an interviewer might ask.',
      '2. The intent behind the question (what they are really evaluating).',
      '3. A strong model answer based on my background, using the STAR method.',
      '',
      'Cover a mix of: behavioral, technical, and "tell me about yourself" questions.'
    ].join('\n')
  },

  // ─── Coding ─────────────────────────────────────────────────────────────
  {
    id: 'code-review',
    name: 'Code Review Assistant',
    category: 'Coding',
    description: 'Reviews a code snippet for bugs, style, performance, and security issues.',
    tags: ['code-review', 'quality', 'security'],
    content: [
      'Review the following {{language}} code as a senior engineer.',
      '',
      '```{{language}}',
      '{{code}}',
      '```',
      '',
      'Evaluate it for:',
      '1. Correctness bugs and edge cases.',
      '2. Performance issues (time/space complexity).',
      '3. Security vulnerabilities (injection, unsafe handling).',
      '4. Readability and adherence to idiomatic style.',
      '5. Missing error handling or tests.',
      '',
      'Report each issue as: [SEVERITY] summary, where it is, why it matters, and a concrete fix.'
    ].join('\n')
  },
  {
    id: 'debug-helper',
    name: 'Debug Helper',
    category: 'Coding',
    description: 'Systematically diagnoses a bug with a hypothesis-driven approach.',
    tags: ['debug', 'troubleshooting', 'error'],
    content: [
      'Help me debug this issue.',
      '',
      'What I am trying to do: {{goal}}',
      'Language / framework: {{stack}}',
      'Expected behavior: {{expected}}',
      'Actual behavior: {{actual}}',
      'Error message: {{error}}',
      'What I already tried: {{attempts}}',
      '',
      'Please:',
      '1. Propose the 3 most likely root causes, ranked by probability.',
      '2. For each, give a targeted way to confirm or rule it out.',
      '3. Then provide the most probable fix with a minimal code example.',
      '4. Tell me what to add (logs, tests) to catch this class of bug faster next time.'
    ].join('\n')
  },
  {
    id: 'sql-writer',
    name: 'SQL Query Writer',
    category: 'Coding',
    description: 'Writes an efficient SQL query from a plain-English data request.',
    tags: ['sql', 'database', 'query'],
    content: [
      'Write a SQL query for the following request.',
      '',
      'Database: {{database}}',
      'Schema (tables + columns):',
      '{{schema}}',
      '',
      'Request: {{request}}',
      '',
      'Requirements:',
      '- Return only the columns needed for this request.',
      '- Use indexes-friendly patterns (avoid functions on indexed columns in WHERE).',
      '- Use explicit JOIN syntax and meaningful aliases.',
      '- Handle NULLs and edge cases explicitly.',
      '- If performance matters, add an EXPLAIN or note an index suggestion.'
    ].join('\n')
  },

  // ─── Research ───────────────────────────────────────────────────────────
  {
    id: 'literature-summarizer',
    name: 'Literature Summarizer',
    category: 'Research',
    description: 'Distills a paper or article into key findings, methods, and limitations.',
    tags: ['research', 'paper', 'summary'],
    content: [
      'Summarize the following {{material_type}} using this structure:',
      '',
      '1. **Core claim** — the main finding in 1-2 sentences.',
      '2. **Method** — how the authors arrived at it.',
      '3. **Key evidence** — the 3 strongest supporting points.',
      '4. **Limitations** — what this material does NOT tell us.',
      '5. **Implications** — why this matters for a practitioner.',
      '6. **Open questions** — what to read next to go deeper.',
      '',
      'Keep the summary faithful to the original — do not add outside information.',
      '',
      'Material:',
      '{{material}}'
    ].join('\n')
  },
  {
    id: 'research-questions',
    name: 'Research Question Generator',
    category: 'Research',
    description: 'Turns a broad topic into focused, researchable questions.',
    tags: ['research', 'questions', 'topic'],
    content: [
      'I am researching the topic: {{topic}}',
      '',
      'Generate:',
      '1. Five specific, researchable questions about this topic.',
      '2. For each question, state what kind of evidence would answer it (study, dataset, analysis).',
      '3. The 2 most promising questions, with a suggested search strategy (keywords, sources).',
      '',
      'Prefer questions that are: precise, answerable with available data, and non-trivial.'
    ].join('\n')
  },
  {
    id: 'fact-checker',
    name: 'Fact-Check Assistant',
    category: 'Research',
    description: 'Verifies claims, identifies unverifiable statements, and flags bias.',
    tags: ['research', 'verification', 'claims'],
    content: [
      'Fact-check the following claims. Treat unverified statements as "unverified", not true.',
      '',
      'Claims to check:',
      '{{claims}}',
      '',
      'For each claim, provide:',
      '1. Verdict: VERIFIED / PARTLY TRUE / UNVERIFIED / FALSE.',
      '2. Evidence: specific, checkable sources that support or refute it.',
      '3. Confidence: high / medium / low, and why.',
      '4. What would settle it conclusively.',
      '',
      'If a claim mixes a true premise with a false conclusion, flag the mismatch explicitly.'
    ].join('\n')
  },

  // ─── Business ───────────────────────────────────────────────────────────
  {
    id: 'swot-analysis',
    name: 'SWOT Analysis Generator',
    category: 'Business',
    description: 'Builds a structured SWOT analysis from a business description.',
    tags: ['business', 'swot', 'strategy'],
    content: [
      'Perform a SWOT analysis for the following business.',
      '',
      'Business description: {{business}}',
      'Market context: {{market}}',
      '',
      'Produce a 2x2 grid with:',
      '- **Strengths** (internal, 4-5 items)',
      '- **Weaknesses** (internal, 4-5 items)',
      '- **Opportunities** (external, 4-5 items)',
      '- **Threats** (external, 4-5 items)',
      '',
      'Then recommend the single highest-leverage action that combines a strength with an opportunity, and the single most important risk to mitigate.'
    ].join('\n')
  },
  {
    id: 'elevator-pitch',
    name: 'Elevator Pitch Creator',
    category: 'Business',
    description: 'Crafts a 30-second pitch that explains what you do and why it matters.',
    tags: ['pitch', 'startup', 'value-proposition'],
    content: [
      'Write a 30-second elevator pitch for: {{description}}',
      '',
      'Audience: {{audience}}',
      '',
      'Structure:',
      '1. Hook — the problem worth caring about.',
      '2. Your solution — what it is in one sentence.',
      '3. Proof — one concrete differentiator or result.',
      '4. Ask — the response you want (meeting, call, referral).',
      '',
      'Give me 3 versions: investor, customer, and hiring-candidate. Each under 60 words.'
    ].join('\n')
  },
  {
    id: 'business-plan-outline',
    name: 'Business Plan Outline',
    category: 'Business',
    description: 'Structures a full business plan section by section.',
    tags: ['business', 'plan', 'startup'],
    content: [
      'Create a business plan outline for: {{business}}',
      '',
      'Stage: {{stage}}',
      '',
      'Structure it as:',
      '1. **Executive summary** — the ask and the one-line pitch.',
      '2. **Problem & solution** — who hurts, how we fix it.',
      '3. **Market** — TAM/SAM/SOM with the assumptions stated.',
      '4. **Business model** — revenue, pricing, unit economics.',
      '5. **Go-to-market** — channels and first 100 customers.',
      '6. **Financial plan** — 3-year projections with drivers.',
      '7. **Risks & mitigations** — the top 5 risks and a plan for each.',
      '',
      'For each section, list 2-3 questions I must answer before presenting this plan.'
    ].join('\n')
  },

  // ─── Marketing ──────────────────────────────────────────────────────────
  {
    id: 'social-media-post',
    name: 'Social Media Post Generator',
    category: 'Marketing',
    description: 'Writes platform-specific social posts from one piece of source content.',
    tags: ['social-media', 'content', 'platform'],
    content: [
      'Turn the following content into social media posts for {{platform}}.',
      '',
      'Source content: {{content}}',
      'Brand voice: {{voice}}',
      '',
      'Create 3 variations, each with:',
      '- A hook (first line) that stops the scroll.',
      '- A body that delivers one clear value.',
      '- A call to action.',
      '- 5-8 relevant hashtags.',
      '',
      'Vary the angle across: educational, emotional, and contrarian.'
    ].join('\n')
  },
  {
    id: 'ad-copy',
    name: 'Ad Copy Writer',
    category: 'Marketing',
    description: 'Drafts high-converting ad copy with a headline, body, and CTA.',
    tags: ['ads', 'copywriting', 'conversion'],
    content: [
      'Write ad copy for the following product.',
      '',
      'Product: {{product}}',
      'Target customer: {{audience}}',
      'Pain point it solves: {{pain_point}}',
      'Differentiator: {{differentiator}}',
      '',
      'Deliverables:',
      '- 5 headlines (under 8 words, benefit-led).',
      '- 3 body paragraphs (each under 60 words, feature-to-benefit).',
      '- 3 call-to-action options.',
      '- 1 "negative option" ad that sells by naming what the customer is settling for.'
    ].join('\n')
  },
  {
    id: 'seo-blog-outline',
    name: 'SEO Blog Outline',
    category: 'Marketing',
    description: 'Generates a keyword-targeted blog outline with an H1, H2s, and FAQs.',
    tags: ['seo', 'blog', 'content'],
    content: [
      'Create a detailed blog post outline targeting the keyword: {{keyword}}',
      '',
      'Search intent: {{intent}}',
      'Target reader: {{reader}}',
      '',
      'Include:',
      '1. A working H1 and meta description.',
      '2. H2 sections that map to the top search intents.',
      '3. H3 sub-points under each H2.',
      '4. A suggested FAQ section (4 questions people also ask).',
      '5. One distinctive angle or data point that makes this post stand out from existing results.',
      '6. Internal-link and external-link suggestions.'
    ].join('\n')
  },

  // ─── Study ──────────────────────────────────────────────────────────────
  {
    id: 'study-guide',
    name: 'Study Guide Creator',
    category: 'Study',
    description: 'Turns notes or a textbook chapter into a structured study guide.',
    tags: ['study', 'learning', 'notes'],
    content: [
      'Turn the following material into a study guide for a {{level}} student.',
      '',
      'Material: {{material}}',
      '',
      'Format:',
      '- **Key concepts** (what must be known).',
      '- **Relationships** (how concepts connect).',
      '- **Common mistakes** to avoid.',
      '- **Practice questions** (5 recall + 3 application).',
      '- **Memory aids** (mnemonics or analogies for the hardest parts).',
      '',
      'Prioritize the 20% of content that covers 80% of likely exam questions.'
    ].join('\n')
  },
  {
    id: 'flashcards',
    name: 'Flashcard Maker',
    category: 'Study',
    description: 'Converts study material into front/back flashcards for spaced repetition.',
    tags: ['study', 'flashcards', 'anki'],
    content: [
      'Create flashcards from the material below.',
      '',
      'Material: {{material}}',
      '',
      'Rules:',
      '- Each card has a front (question or cue) and back (answer).',
      '- Prefer "how/why" over "what" to build understanding, not recall.',
      '- Include 2 "application" cards where the answer is a solved mini-example.',
      '- Mark the 3 most important cards with "**CORE**".',
      '',
      'Return them as a numbered list, ready to paste into Anki.'
    ].join('\n')
  },
  {
    id: 'concept-explainer',
    name: 'Concept Explainer (Feynman)',
    category: 'Study',
    description: 'Explains a concept in plain language to reveal gaps in your understanding.',
    tags: ['study', 'feynman', 'learning'],
    content: [
      'Explain the following concept as if I were an intelligent 12-year-old, using an analogy:',
      '',
      'Concept: {{concept}}',
      '',
      'Then:',
      '1. Give the 3 most common misconceptions about it.',
      '2. Explain it again using a completely different analogy.',
      '3. Ask me 3 questions to test whether I really understand it.',
      '4. List the prerequisite concepts I should master first, if any.'
    ].join('\n')
  },

  // ─── AI Agents ──────────────────────────────────────────────────────────
  {
    id: 'system-prompt-designer',
    name: 'System Prompt Designer',
    category: 'AI Agents',
    description: 'Drafts a production-grade system prompt with role, rules, and output format.',
    tags: ['agents', 'system-prompt', 'llm'],
    content: [
      'Design a system prompt for an AI agent that: {{purpose}}',
      '',
      'Constraints:',
      '- Personality / tone: {{tone}}',
      '- Tools available: {{tools}}',
      '- Safety rules to enforce: {{safety_rules}}',
      '',
      'Deliverables:',
      '1. A full system prompt (~200 words).',
      '2. A "do not" list of the 5 most common failure modes for this task.',
      '3. A structured output schema (JSON) the agent should return.',
      '4. 3 few-shot examples the agent should be primed with.',
      '',
      'Make the prompt robust to user attempts to override the system instructions.'
    ].join('\n')
  },
  {
    id: 'agent-workflow',
    name: 'Agent Workflow Planner',
    category: 'AI Agents',
    description: 'Plans the steps, tools, and handoffs for a multi-step agent task.',
    tags: ['agents', 'workflow', 'orchestration'],
    content: [
      'I am building an AI agent to accomplish: {{goal}}',
      '',
      'Available capabilities: {{capabilities}}',
      '',
      'Design the workflow:',
      '1. Break the goal into a DAG of subtasks (name each step).',
      '2. For each step: input, required capability, expected output, and failure fallback.',
      '3. Identify which steps can run in parallel and which are sequential.',
      '4. Specify a human-in-the-loop checkpoint where the agent should ask before proceeding.',
      '5. List the metrics that would tell me the workflow is working.'
    ].join('\n')
  },
  {
    id: 'tool-selection',
    name: 'Tool Selection Advisor',
    category: 'AI Agents',
    description: 'Recommends which tools, models, and techniques fit a task.',
    tags: ['agents', 'tools', 'selection'],
    content: [
      'Recommend the best technical setup for: {{task}}',
      '',
      'Constraints: {{constraints}}',
      'Budget: {{budget}}',
      '',
      'Recommend:',
      '1. **Model** — which class of model (and why), with the reasoning-quality vs cost trade-off.',
      '2. **Tools** — specific libraries/APIs that solve the hardest part.',
      '3. **Technique** — RAG, fine-tuning, prompting, or agent loop, and when it matters.',
      '4. **Failure modes** — the 3 most likely ways this fails in production.',
      '5. **Pilot plan** — the smallest experiment that validates the approach in a week.'
    ].join('\n')
  },

  // ─── Writing ────────────────────────────────────────────────────────────
  {
    id: 'story-ideas',
    name: 'Story Idea Generator',
    category: 'Writing',
    description: 'Generates premise ideas from a seed: character, setting, or theme.',
    tags: ['writing', 'fiction', 'ideas'],
    content: [
      'Generate story ideas from the following seed: {{seed}}',
      '',
      'For each idea, give:',
      '1. A one-line logline.',
      '2. The central conflict.',
      '3. The protagonist\'s fatal flaw.',
      '4. A twist that reframes the story.',
      '',
      'Create 5 ideas across different genres. Then pick the strongest one and expand it into a 3-act structure with 6 beat points.'
    ].join('\n')
  },
  {
    id: 'essay-outliner',
    name: 'Essay Outliner',
    category: 'Writing',
    description: 'Builds a thesis-driven essay outline from a prompt and stance.',
    tags: ['writing', 'essay', 'structure'],
    content: [
      'Create a persuasive essay outline for the prompt: {{prompt}}',
      'My stance: {{stance}}',
      'Word count target: {{word_count}}',
      '',
      'Deliverables:',
      '1. A strong, arguable thesis statement.',
      '2. Three supporting arguments, each with 2-3 pieces of evidence.',
      '3. The best counterargument and how to rebut it.',
      '4. An introduction hook and a conclusion strategy.',
      '5. A paragraph-by-paragraph outline with estimated word counts.'
    ].join('\n')
  },
  {
    id: 'headline-writer',
    name: 'Headline Writer',
    category: 'Writing',
    description: 'Writes punchy headlines for an article or post.',
    tags: ['writing', 'headlines', 'copy'],
    content: [
      'Write 10 headline options for this article: {{topic}}',
      '',
      'Target audience: {{audience}}',
      'Desired tone: {{tone}}',
      '',
      'Spread across these formulas:',
      '- How-to / benefit',
      '- Listicle (number-based)',
      '- Question (curiosity gap)',
      '- Contrarian (against conventional wisdom)',
      '- Curiosity / open loop',
      '',
      'Mark the strongest 3 and explain the psychology behind each in one line.'
    ].join('\n')
  },

  // ─── Emails ─────────────────────────────────────────────────────────────
  {
    id: 'professional-email',
    name: 'Professional Email Writer',
    category: 'Emails',
    description: 'Drafts a clear, professional email from a rough draft or bullet points.',
    tags: ['email', 'professional', 'communication'],
    content: [
      'Turn the following notes into a professional email:',
      '',
      'Notes: {{notes}}',
      'Recipient: {{recipient}}',
      'Tone: {{tone}}',
      '',
      'Requirements:',
      '- A clear subject line (under 10 words).',
      '- A polite opening that names the purpose.',
      '- Short paragraphs, one idea each.',
      '- A specific ask or next step.',
      '- A courteous sign-off.',
      '',
      'Give me 2 versions: one formal, one slightly warmer.'
    ].join('\n')
  },
  {
    id: 'cold-outreach',
    name: 'Cold Outreach Email',
    category: 'Emails',
    description: 'Writes a personal, low-pressure outreach email that gets replies.',
    tags: ['email', 'outreach', 'networking'],
    content: [
      'Write a cold outreach email to: {{recipient_description}}',
      '',
      'My reason for reaching out: {{reason}}',
      'What I admire about them (be specific): {{compliment}}',
      '',
      'Rules:',
      '- Under 150 words.',
      '- A personal, specific opening line (no "hope this finds you well").',
      '- One clear, low-commitment ask (a 15-min chat, a link, a reply).',
      '- No hard sell. Make it easy to say yes, easy to ignore.',
      '- End with a soft question that invites a reply.'
    ].join('\n')
  },
  {
    id: 'follow-up-email',
    name: 'Follow-Up Email',
    category: 'Emails',
    description: 'Crafts a polite follow-up that nudges without being pushy.',
    tags: ['email', 'follow-up', 'sales'],
    content: [
      'Write a follow-up email about: {{context}}',
      '',
      'Previous message sent: {{previous}}',
      'How long it has been: {{elapsed}}',
      '',
      'Requirements:',
      '- Acknowledge they may be busy.',
      '- Add one NEW piece of value (a resource, a data point, a time saver) rather than repeating the original ask.',
      '- A single call to action.',
      '- Keep it shorter than the original email.',
      '- A graceful out: make clear they can say "no" with one word.'
    ].join('\n')
  }
];

export function getTemplatesByCategory(category: TemplateCategory): readonly PromptTemplate[] {
  return TEMPLATES.filter((t) => t.category === category);
}

export function getTemplateById(id: string): PromptTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

/** Extracts {{variable}} names from a template's content. */
export function extractVariables(content: string): string[] {
  const matches = content.match(/\{\{([a-z0-9_]+)\}\}/gi) ?? [];
  return [...new Set(matches.map((m) => m.replace(/[{}]/g, '')))];
}

/** Replaces {{variable}} placeholders with user-provided values. */
export function fillTemplate(content: string, values: Record<string, string>): string {
  return content.replace(/\{\{([a-z0-9_]+)\}\}/gi, (_match, name: string) => {
    const key = name.toLowerCase();
    const value = values[key] ?? values[name];
    return value !== undefined && value !== '' ? value : `{{${name}}}`;
  });
}