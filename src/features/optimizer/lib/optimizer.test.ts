import { describe, expect, it } from 'vitest';
import { analyzePrompt, gradeScore, scoreLabel } from './optimizer';

describe('analyzePrompt', () => {
  it('returns 0 score and an empty-prompt issue for empty input', () => {
    const result = analyzePrompt('');
    expect(result.score.overall).toBe(0);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]!.severity).toBe('high');
  });

  it('rates a well-structured prompt highly', () => {
    const text = [
      'You are a senior product designer.',
      'Write a 200-word launch announcement for a new design tool aimed at indie developers.',
      'Format: 3 short paragraphs plus a bullet list of 5 key features.',
      'Constraints:',
      '- Avoid buzzwords and marketing clichés.',
      '- Tone: confident, friendly, concrete.',
      '- Include at least one quoted user testimonial.'
    ].join('\n');
    const result = analyzePrompt(text);
    expect(result.score.overall).toBeGreaterThan(75);
    expect(result.detectedSignals.hasRole).toBe(true);
    expect(result.detectedSignals.hasAudience).toBe(true);
    expect(result.detectedSignals.hasFormat).toBe(true);
    expect(result.detectedSignals.hasConstraints).toBe(true);
  });

  it('flags weak / hedging phrases', () => {
    const result = analyzePrompt('Write maybe a short summary of this thing, kind of like an intro.');
    const weakIssues = result.issues.filter((i) => i.category === 'weak-instruction');
    expect(weakIssues.length).toBeGreaterThan(0);
    expect(result.score.clarity).toBeLessThan(100);
  });

  it('flags missing role / audience / format / constraints', () => {
    const result = analyzePrompt(
      'Explain how quantum entanglement works and what it means for information transfer. ' +
        'Be thorough and include several examples with detailed reasoning about the underlying physics.'
    );
    expect(result.detectedSignals.hasRole).toBe(false);
    expect(result.detectedSignals.hasAudience).toBe(false);
    expect(result.detectedSignals.hasFormat).toBe(false);
    expect(result.detectedSignals.hasConstraints).toBe(false);
    const categories = result.issues.map((i) => i.category);
    expect(categories).toContain('no-role');
    expect(categories).toContain('no-audience');
    expect(categories).toContain('no-format');
    expect(categories).toContain('no-constraints');
  });

  it('detects repetition', () => {
    const text = 'Please summarize this. Please summarize this. Please summarize this.';
    const result = analyzePrompt(text);
    const repIssues = result.issues.filter((i) => i.category === 'repetition');
    expect(repIssues.length).toBeGreaterThan(0);
    expect(result.score.brevity).toBeLessThan(100);
  });

  it('flags very long prompts', () => {
    const long = 'word '.repeat(900).trim();
    const result = analyzePrompt(long);
    const longIssues = result.issues.filter((i) => i.category === 'long-prompt');
    expect(longIssues.length).toBeGreaterThan(0);
    expect(longIssues[0]!.severity).toBe('high');
  });

  it('penalizes filler phrases', () => {
    const text = 'In order to complete this task, due to the fact that the system is complex, at this point in time we need to write a report.';
    const result = analyzePrompt(text);
    const fillerIssues = result.issues.filter((i) => i.category === 'filler');
    expect(fillerIssues.length).toBeGreaterThan(0);
  });

  it('rewards concrete signals (numbers, names, code)', () => {
    const withConcrete = analyzePrompt('Refactor `calculateTotal()` to handle 3 edge cases: empty input, negative numbers, and decimals. Output as TypeScript.');
    const vague = analyzePrompt('Fix the function. Make it better.');
    expect(withConcrete.score.context).toBeGreaterThan(vague.score.context);
    expect(withConcrete.score.overall).toBeGreaterThan(vague.score.overall);
  });

  it('counts words and characters', () => {
    const text = 'Hello world from AIDock.';
    const result = analyzePrompt(text);
    expect(result.wordCount).toBe(4);
    expect(result.characterCount).toBe(text.length);
  });

  it('returns sensible structure score for bulleted prompts', () => {
    const bulleted = analyzePrompt('Plan a launch:\n- Define audience\n- Write copy\n- Pick channel');
    const flat = analyzePrompt('Plan a launch. Define audience. Write copy. Pick channel.');
    expect(bulleted.score.structure).toBeGreaterThan(flat.score.structure);
  });

  it('issues are sorted by severity (high first)', () => {
    // Empty is the strongest signal of severity; build something mixed
    const text = 'Maybe just summarize this article. I think it would be good.';
    const result = analyzePrompt(text);
    if (result.issues.length >= 2) {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      for (let i = 1; i < result.issues.length; i += 1) {
        const prev = severityOrder[result.issues[i - 1]!.severity];
        const cur = severityOrder[result.issues[i]!.severity];
        expect(cur).toBeGreaterThanOrEqual(prev);
      }
    }
  });
});

describe('gradeScore', () => {
  it('maps scores to letter grades', () => {
    expect(gradeScore(95)).toBe('A');
    expect(gradeScore(80)).toBe('B');
    expect(gradeScore(65)).toBe('C');
    expect(gradeScore(50)).toBe('D');
    expect(gradeScore(20)).toBe('F');
  });
});

describe('scoreLabel', () => {
  it('returns human-readable labels', () => {
    expect(scoreLabel(95)).toBe('Excellent');
    expect(scoreLabel(80)).toBe('Strong');
    expect(scoreLabel(65)).toBe('Good');
    expect(scoreLabel(50)).toBe('Needs work');
    expect(scoreLabel(20)).toBe('Weak');
  });
});