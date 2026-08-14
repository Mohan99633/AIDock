/**
 * Curated AI Marketplace catalog.
 * Each "kit" is a themed bundle of ready-to-use prompts. Kits are browsed in the
 * Marketplace tab and can be imported into the active workspace in one click.
 */

export type MarketplaceKit = {
  id: string;
  name: string;
  author: string;
  category: 'Coding' | 'Writing' | 'Business' | 'Marketing' | 'Study' | 'AI Agents';
  description: string;
  tags: string[];
  rating: number; // 0-5
  downloads: number;
  updatedAt: number;
  prompts: Array<{ title: string; content: string }>;
};

export const MARKETPLACE_KITS: readonly MarketplaceKit[] = [
  {
    id: 'software-architect',
    name: 'Software Architect Kit',
    author: 'AIDock Team',
    category: 'Coding',
    description:
      'System design, code review, refactoring, and API design prompts for senior engineering work.',
    tags: ['architecture', 'system-design', 'code-review'],
    rating: 4.8,
    downloads: 12400,
    updatedAt: 1784160000000,
    prompts: [
      {
        title: 'System Design Review',
        content:
          'Act as a principal software architect. Review the following system design for scalability, reliability, and cost. Architecture: {{architecture}}. Identify the top 5 risks and suggest a concrete improvement for each.'
      },
      {
        title: 'Refactor Proposal',
        content:
          'Analyze this codebase excerpt and propose a refactoring plan that improves readability and testability without changing behavior. Code: {{code}}. Give a step-by-step migration plan with risk levels.'
      },
      {
        title: 'API Contract Design',
        content:
          'Design a REST API contract for {{use_case}}. Include endpoints, request/response schemas, error handling, and pagination. Use OpenAPI 3 style and flag any design trade-offs.'
      }
    ]
  },
  {
    id: 'saas-marketing-pack',
    name: 'SaaS Marketing Pack',
    author: 'Growth Lab',
    category: 'Marketing',
    description:
      'Landing page copy, cold email, product launch, and positioning prompts for SaaS teams.',
    tags: ['saas', 'copywriting', 'launch'],
    rating: 4.6,
    downloads: 9800,
    updatedAt: 1782950000000,
    prompts: [
      {
        title: 'Landing Page Hero Copy',
        content:
          'Write a hero section for our SaaS landing page. Product: {{product}}. One-line value prop: {{value_prop}}. Audience: {{audience}}. Include headline, subheadline, and primary CTA. Aim for clarity over cleverness.'
      },
      {
        title: 'Product Launch Email Sequence',
        content:
          'Draft a 4-email launch sequence for {{product}} going to {{audience}}. Emails: teaser, launch, social proof, last chance. Each under 120 words with a single CTA.'
      },
      {
        title: 'Competitive Positioning Memo',
        content:
          'Write a positioning memo for {{product}} against {{competitor}}. Identify 3 defensible differentiators, the category the product "reframes", and one message customers will repeat.'
      }
    ]
  },
  {
    id: 'academic-thesis-kit',
    name: 'Academic Thesis Kit',
    author: 'Scholar Hub',
    category: 'Study',
    description:
      'Literature review, research question, and argument structure prompts for thesis writers.',
    tags: ['thesis', 'academic', 'research'],
    rating: 4.7,
    downloads: 7600,
    updatedAt: 1781390000000,
    prompts: [
      {
        title: 'Literature Review Map',
        content:
          'Help me structure a literature review for my thesis on {{topic}}. Identify the main schools of thought, the key debates, and where the gaps are. Suggest 10 seminal papers a reviewer would expect me to cite.'
      },
      {
        title: 'Sharpen Research Question',
        content:
          'Critique and sharpen my research question: {{question}}. Make it specific, answerable, and non-trivial. Then propose 2 alternative framings with the trade-offs of each.'
      },
      {
        title: 'Argument Scaffolding',
        content:
          'Build a thesis argument scaffold for the claim: {{claim}}. Give the supporting premises, the strongest counterargument, my rebuttal, and the evidence types needed to defend each premise.'
      }
    ]
  },
  {
    id: 'llm-engineer-pack',
    name: 'LLM Engineer Pack',
    author: 'PromptForge',
    category: 'AI Agents',
    description:
      'System prompt design, RAG pipeline, evaluation, and agent tooling prompts for building LLM apps.',
    tags: ['llm', 'rag', 'agents', 'evaluation'],
    rating: 4.9,
    downloads: 15300,
    updatedAt: 1784590000000,
    prompts: [
      {
        title: 'System Prompt Builder',
        content:
          'Design a production system prompt for an assistant that {{purpose}}. Include role, constraints, tools, output schema, and 3 few-shot examples. Make it resilient to prompt injection attempts.'
      },
      {
        title: 'RAG Pipeline Design',
        content:
          'Design a RAG pipeline for {{use_case}}. Recommend chunking strategy, embedding model, retrieval approach, reranking, and how to evaluate retrieval quality. Note the failure modes of naive chunking.'
      },
      {
        title: 'LLM Evaluation Harness',
        content:
          'Create an evaluation plan for {{model_task}}. Define 20 test cases covering edge cases, the golden answers, the metrics (accuracy, latency, cost), and how to detect regression over time.'
      }
    ]
  },
  {
    id: 'productivity-hacker',
    name: 'Productivity Hacker',
    author: 'Deep Work Co.',
    category: 'Business',
    description:
      'Planning, decision-making, meeting, and email prompts to reclaim your workday.',
    tags: ['productivity', 'planning', 'meetings'],
    rating: 4.5,
    downloads: 11200,
    updatedAt: 1783730000000,
    prompts: [
      {
        title: 'Weekly Planning Session',
        content:
          'Act as a productivity coach. Based on my goals ({{goals}}) and current commitments ({{commitments}}), build my weekly plan. Prioritize the top 3 outcomes, schedule deep work blocks, and flag what to defer or delegate.'
      },
      {
        title: 'Decision Framing',
        content:
          'Help me decide: {{decision}}. Frame the decision with options, decision criteria, and the information that would change my choice. Play devil\'s advocate on my preferred option.'
      },
      {
        title: 'Meeting Notes to Actions',
        content:
          'Convert these meeting notes into clear next actions. Notes: {{notes}}. For each action: owner, due date, and the blocker that could prevent it. Then identify any decisions that were left unmade.'
      }
    ]
  },
  {
    id: 'creative-writing-vault',
    name: 'Creative Writing Vault',
    author: 'StoryCraft',
    category: 'Writing',
    description:
      'Worldbuilding, character, scene, and revision prompts for fiction writers.',
    tags: ['fiction', 'worldbuilding', 'characters'],
    rating: 4.6,
    downloads: 8900,
    updatedAt: 1783470000000,
    prompts: [
      {
        title: 'Worldbuilding Bible',
        content:
          'Build a concise worldbuilding bible for my setting {{setting}}. Cover: the magic/tech rules, the power structures, the economy, the daily life, and 3 tensions that would generate stories. Stay internally consistent.'
      },
      {
        title: 'Character Voice Sheet',
        content:
          'Develop a character voice for {{character_description}}. Give me 5 sample dialogue lines, their speech tics, what they never say, and how their voice changes under stress.'
      },
      {
        title: 'Scene Revision Pass',
        content:
          'Revise this scene for emotional impact and pacing: {{scene}}. Keep my voice. Show me the "before → after" for the 3 weakest moments and explain what each change accomplishes.'
      }
    ]
  }
];

export function getMarketplaceKitById(id: string): MarketplaceKit | undefined {
  return MARKETPLACE_KITS.find((k) => k.id === id);
}
