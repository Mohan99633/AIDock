import { describe, expect, it } from 'vitest';
import type { SearchInput } from './search';
import { searchAll } from './search';

describe('searchAll', () => {
  const baseInput: SearchInput = {
    prompts: [
      {
        title: 'Write a poem',
        content: 'Create a poem about spring',
        category: 'Writing',
        tags: ['creative', 'poetry']
      },
      {
        title: 'Debug code',
        content: 'Fix the bug in the login function',
        category: 'Coding',
        tags: ['debug', 'javascript']
      }
    ],
    notes: [
      {
        title: 'Meeting notes',
        content: 'Discussed project timeline',
        tags: ['meeting', 'project']
      }
    ],
    history: [
      {
        promptContent: 'Explain quantum physics',
        aiResponseContent: 'Quantum physics is the study of matter and energy at the most fundamental level.',
        aiPlatform: 'chatgpt',
        tags: ['science', 'physics']
      }
    ],
    collections: [
      {
        name: 'Writing Prompts',
        description: 'A collection of creative writing prompts'
      }
    ]
  };

  it('returns empty array for empty query', () => {
    expect(searchAll(baseInput, '')).toHaveLength(0);
    expect(searchAll(baseInput, '   ')).toHaveLength(0);
  });

  it('finds prompt by title', () => {
    const results = searchAll(baseInput, 'poem');
    expect(results).toHaveLength(1);
    expect(results[0]!.kind).toBe('prompt');
    expect(results[0]!.item.title).toBe('Write a poem');
  });

  it('finds prompt by content', () => {
    const results = searchAll(baseInput, 'bug');
    expect(results).toHaveLength(1);
    expect(results[0]!.kind).toBe('prompt');
    expect(results[0]!.item.title).toBe('Debug code');
  });

  it('finds note by tag', () => {
    const results = searchAll(baseInput, 'meeting');
    expect(results).toHaveLength(1);
    expect(results[0]!.kind).toBe('note');
    expect(results[0]!.item.title).toBe('Meeting notes');
  });

  it('finds history by prompt content', () => {
    const results = searchAll(baseInput, 'quantum');
    expect(results).toHaveLength(1);
    expect(results[0]!.kind).toBe('history');
    expect(results[0]!.item.promptContent).toBe('Explain quantum physics');
  });

  it('finds collection by description', () => {
    const results = searchAll(baseInput, 'creative writing');
    expect(results).toHaveLength(1);
    expect(results[0]!.kind).toBe('collection');
    expect(results[0]!.item.name).toBe('Writing Prompts');
  });

  it('ranks by score (title > content > tag)', () => {
    const input: SearchInput = {
      prompts: [
        {
          title: 'Exact match title',
          content: 'Some content',
          category: '',
          tags: []
        },
        {
          title: 'Another title',
          content: 'Exact match content',
          category: '',
          tags: []
        },
        {
          title: 'Another title',
          content: 'Some content',
          category: '',
          tags: ['exact', 'match', 'tag']
        }
      ],
      notes: [],
      history: [],
      collections: []
    };
    const results = searchAll(input, 'exact match');
    // Title match (weight 2) should come first, then content (weight 1), then tag (weight 1)
    expect(results.length).toBe(3);
    expect(results[0]!.item.title).toBe('Exact match title');
    expect(results[1]!.item.title).toBe('Another title'); // content match
    expect(results[2]!.item.title).toBe('Another title'); // tag match
  });

  it('snippet contains match', () => {
    const results = searchAll(baseInput, 'spring');
    expect(results[0]!.snippet.toLowerCase()).toContain('spring');
  });
});