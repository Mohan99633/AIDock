import React, { useMemo, useState } from 'react';
import { Sparkles, Zap, Copy, Trash2, Wand2, Lightbulb } from 'lucide-react';
import { cn } from '~/shared/lib/cn';
import { analyzePrompt, gradeScore, scoreLabel, type OptimizerIssue, type OptimizerScore } from '~/features/optimizer/lib/optimizer';
import { Button } from '~/shared/ui/button';

const SEVERITY_STYLES: Record<OptimizerIssue['severity'], { badge: string; text: string; ring: string }> = {
  high: {
    badge: 'bg-rose-500/10 text-rose-500',
    text: 'text-rose-500',
    ring: 'border-rose-500/30'
  },
  medium: {
    badge: 'bg-amber-500/10 text-amber-500',
    text: 'text-amber-500',
    ring: 'border-amber-500/30'
  },
  low: {
    badge: 'bg-sky-500/10 text-sky-500',
    text: 'text-sky-500',
    ring: 'border-sky-500/30'
  }
};

const EXAMPLE_PROMPT = [
  'Write a summary of this article about AI.',
  'Make it good and maybe add some points about the future.',
  'Also mention the key ideas if you can, I think it would be useful.',
  'Keep it under a page I guess.'
].join('\n');

function scoreColor(score: number): string {
  if (score >= 75) return 'text-emerald-500';
  if (score >= 60) return 'text-amber-500';
  return 'text-rose-500';
}

export function OptimizerShell(): JSX.Element {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);

  const analysis = useMemo(() => analyzePrompt(text), [text]);
  const isEmpty = text.trim().length === 0;
  const grade = gradeScore(analysis.score.overall);
  const label = scoreLabel(analysis.score.overall);

  const handleCopyIssues = async () => {
    if (analysis.issues.length === 0) return;
    const block = analysis.issues
      .map((issue) => `- [${issue.severity}] ${issue.message}\n  → ${issue.suggestion}`)
      .join('\n');
    await navigator.clipboard.writeText(block);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const severityOrder: Record<OptimizerIssue['severity'], number> = { high: 0, medium: 1, low: 2 };
  const sortedIssues = useMemo(
    () => [...analysis.issues].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [analysis.issues]
  );

  return (
    <div className="flex flex-col h-full w-[380px] bg-background">
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-primary" />
          <h1 className="text-base font-semibold">Prompt Optimizer</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setText(EXAMPLE_PROMPT)}
          className="text-xs"
        >
          <Sparkles className="h-3.5 w-3.5 mr-1" />
          Try example
        </Button>
      </div>

      <div className="px-4 pb-3">
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
          Paste a prompt to analyze
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste any prompt here... The analyzer runs live as you type."
          rows={6}
          className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
        />
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {analysis.wordCount} words · {analysis.characterCount} chars
          </span>
          <div className="flex items-center gap-1.5">
            {!isEmpty && analysis.issues.length > 0 && (
              <Button variant="ghost" size="xs" onClick={handleCopyIssues}>
                {copied ? <Lightbulb className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied' : 'Copy tips'}
              </Button>
            )}
            {!isEmpty && (
              <Button variant="ghost" size="xs" onClick={() => setText('')}>
                <Trash2 className="h-3 w-3" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Wand2 className="h-12 w-12 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground max-w-[260px]">
            Paste a prompt above and get an instant quality score with targeted suggestions for improvement.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto px-4 pb-4 space-y-4">
          <ScoreCard grade={grade} label={label} score={analysis.score} />

          {analysis.issues.length === 0 ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-center">
              <Zap className="mx-auto h-6 w-6 text-emerald-500 mb-2" />
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                No issues found!
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                This prompt already includes a role, audience, format, constraints, and concrete context.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Suggestions ({analysis.issues.length})
              </h2>
              {sortedIssues.map((issue, idx) => (
                <IssueRow key={`${issue.category}-${idx}`} issue={issue} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ScoreCard({ grade, label, score }: { grade: string; label: string; score: OptimizerScore }) {
  const dimensionRows: Array<{ key: keyof OptimizerScore; label: string }> = [
    { key: 'clarity', label: 'Clarity' },
    { key: 'specificity', label: 'Specificity' },
    { key: 'structure', label: 'Structure' },
    { key: 'brevity', label: 'Brevity' },
    { key: 'context', label: 'Context' }
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl border border-border bg-background">
          <span className={cn('text-3xl font-bold', scoreColor(score.overall))}>{score.overall}</span>
          <span className={cn('text-[10px] font-medium uppercase tracking-wide', scoreColor(score.overall))}>
            {grade}
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold">{label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {score.overall >= 75
              ? 'This prompt is well-structured. Fine-tune the details if needed.'
              : score.overall >= 60
                ? 'Solid prompt with room to tighten. Address the suggestions below.'
                : 'This prompt will benefit from the suggestions below.'}
          </p>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {dimensionRows.map(({ key, label: dimLabel }) => (
          <div key={key} className="flex items-center gap-2">
            <span className="w-20 shrink-0 text-xs text-muted-foreground">{dimLabel}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted/40">
              <div
                className={cn('h-full rounded-full', scoreColor(score[key]))}
                style={{ width: `${score[key]}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-xs tabular-nums">{score[key]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function IssueRow({ issue }: { issue: OptimizerIssue }) {
  const [expanded, setExpanded] = useState(false);
  const style = SEVERITY_STYLES[issue.severity];

  return (
    <div className={cn('rounded-lg border bg-card transition-colors', expanded ? style.ring : 'border-border')}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start gap-2 p-3 text-left"
      >
        <span className={cn('mt-0.5 inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase', style.badge)}>
          {issue.severity}
        </span>
        <span className="flex-1 text-sm font-medium text-foreground">{issue.message}</span>
      </button>
      {expanded && (
        <div className="px-3 pb-3">
          <div className="rounded-lg bg-muted/40 p-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              Suggestion
            </p>
            <p className="text-xs text-foreground/90 leading-relaxed">{issue.suggestion}</p>
          </div>
        </div>
      )}
    </div>
  );
}