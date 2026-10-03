import React, { useEffect, useMemo, useState } from 'react';
import { GitCompareArrows, Play, KeyRound, Zap, DollarSign, Ruler, RotateCcw } from 'lucide-react';
import { cn } from '~/shared/lib/cn';
import { CURATED_MODELS, type CuratedModel } from '~/features/model-comparison/data/models';
import {
  compareModels,
  formatLatency,
  formatUsd,
  summarizeComparison,
  type ModelRun
} from '~/features/model-comparison/lib/comparison';
import { useApiKeyStore } from '~/features/settings/state/api-key-store';
import { useLicenseStore } from '~/features/premium/state/license-store';
import { Button } from '~/shared/ui/button';

export function ComparisonShell(): JSX.Element {
  const license = useLicenseStore();
  const { apiKey, hydrated, hydrate, setApiKey, clear } = useApiKeyStore();
  const [prompt, setPrompt] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>(() => [
    CURATED_MODELS[0]?.id ?? '',
    CURATED_MODELS[1]?.id ?? '',
    CURATED_MODELS[2]?.id ?? ''
  ].filter(Boolean));
  const [runs, setRuns] = useState<ModelRun[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [keyInput, setKeyInput] = useState('');

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    setKeyInput(apiKey);
  }, [apiKey]);

  const selectedModels = useMemo(
    () => CURATED_MODELS.filter((m) => selectedIds.includes(m.id)),
    [selectedIds]
  );

  const summary = useMemo(() => summarizeComparison(runs), [runs]);
  const completedCount = runs.filter((r) => r.status === 'success').length;

  const toggleModel = (id: string): void => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleCompare = async (): Promise<void> => {
    if (!prompt.trim() || selectedModels.length === 0) return;
    if (!apiKey.trim()) {
      setRuns([]);
      setIsComparing(false);
      return;
    }
    setRuns([]);
    setIsComparing(true);
    await compareModels(apiKey.trim(), prompt.trim(), selectedModels, (run) => {
      setRuns((prev) => {
        const idx = prev.findIndex((r) => r.modelId === run.modelId);
        if (idx === -1) return [...prev, run];
        const next = [...prev];
        next[idx] = run;
        return next;
      });
    });
    setIsComparing(false);
  };

  const saveKey = (): void => {
    void setApiKey(keyInput.trim());
  };

  const clearResults = (): void => setRuns([]);

  const hasResults = runs.length > 0;

  if (!license.hydrated) return <div />;

  if (license.tier !== 'pro') {
    return (
      <div className="flex flex-col h-full w-[380px] items-center justify-center bg-background p-6 text-center">
        <GitCompareArrows className="h-12 w-12 text-muted-foreground/50 mb-3" />
        <h1 className="text-base font-semibold">Model Comparison</h1>
        <p className="mt-2 max-w-[260px] text-sm text-muted-foreground">
          Compare the same prompt across 8+ models — latency, cost, and response length. This is an{' '}
          <span className="font-medium text-foreground">AIDock Pro</span> feature.
        </p>
        <Button
          variant="primary"
          size="sm"
          className="mt-4"
          onClick={() => license.checkoutUrl && window.open(license.checkoutUrl, '_blank')}
        >
          Upgrade to Pro
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-[380px] bg-background">
      <header className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-2">
          <GitCompareArrows className="h-5 w-5 text-primary" />
          <h1 className="text-base font-semibold">Model Comparison</h1>
        </div>
        {hasResults && (
          <button
            onClick={clearResults}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        )}
      </header>

      <div className="flex-1 overflow-auto px-4 pb-4 space-y-4">
        {/* API key */}
        <section className="rounded-xl border border-border bg-card p-3 space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <KeyRound className="h-3.5 w-3.5" />
            OpenRouter API Key
          </label>
          <div className="flex gap-2">
            <input
              type={showKey ? 'text' : 'password'}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onBlur={saveKey}
              placeholder={apiKey ? '•••••••• (saved)' : 'sk-or-...'}
              className="h-9 flex-1 min-w-0 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary placeholder:text-muted-foreground"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowKey((s) => !s)}
              aria-label={showKey ? 'Hide API key' : 'Show API key'}
            >
              {showKey ? 'Hide' : 'Show'}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">
              {hydrated && apiKey ? 'Key stored locally on this device.' : 'Optional — required to run comparisons.'}
            </p>
            {apiKey && (
              <button
                onClick={() => void clear()}
                className="text-[11px] text-muted-foreground hover:text-destructive underline"
              >
                Remove
              </button>
            )}
          </div>
        </section>

        {/* Prompt */}
        <section className="rounded-xl border border-border bg-card p-3 space-y-2">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="compare-prompt">
            Prompt to compare
          </label>
          <textarea
            id="compare-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Paste a prompt to run across the selected models..."
            rows={4}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none resize-none transition-colors focus:border-primary placeholder:text-muted-foreground"
          />
        </section>

        {/* Model selection */}
        <section className="rounded-xl border border-border bg-card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">Models</label>
            <span className="text-[11px] text-muted-foreground">{selectedModels.length} selected</span>
          </div>
          <ul className="space-y-1.5">
            {CURATED_MODELS.map((model) => (
              <li key={model.id}>
                <label className="flex items-start gap-2.5 cursor-pointer rounded-lg p-1.5 transition-colors hover:bg-muted/40">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(model.id)}
                    onChange={() => toggleModel(model.id)}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-border accent-primary"
                  />
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{model.name}</span>
                      <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
                        {model.provider}
                      </span>
                    </span>
                    <span className="block text-[11px] text-muted-foreground">{model.description}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </section>

        {/* Compare action */}
        <Button
          variant="primary"
          className="w-full"
          onClick={() => void handleCompare()}
          disabled={isComparing || !prompt.trim() || selectedModels.length === 0}
        >
          {isComparing ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
              Comparing…
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Compare {selectedModels.length > 0 ? `${selectedModels.length} models` : ''}
            </>
          )}
        </Button>

        {!apiKey.trim() && hasResults && (
          <p className="rounded-lg border border-dashed border-border px-3 py-2 text-[11px] text-muted-foreground">
            Enter an OpenRouter API key above to run live comparisons.
          </p>
        )}

        {/* Results */}
        {hasResults && (
          <>
            {/* Summary */}
            <section className="rounded-xl border border-border bg-card p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Summary</p>
              <div className="grid grid-cols-2 gap-2">
                <SummaryCell
                  icon={<Zap className="h-3.5 w-3.5" />}
                  label="Fastest"
                  value={summary.fastestModelId ? friendlyName(summary.fastestModelId) : '—'}
                />
                <SummaryCell
                  icon={<DollarSign className="h-3.5 w-3.5" />}
                  label="Cheapest"
                  value={summary.cheapestModelId ? friendlyName(summary.cheapestModelId) : '—'}
                />
                <SummaryCell
                  icon={<Ruler className="h-3.5 w-3.5" />}
                  label="Longest response"
                  value={summary.longestModelId ? friendlyName(summary.longestModelId) : '—'}
                />
                <SummaryCell
                  icon={<DollarSign className="h-3.5 w-3.5" />}
                  label="Total cost (est.)"
                  value={formatUsd(summary.totalCostUsd)}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {completedCount}/{runs.length} succeeded · {summary.totalTokens.toLocaleString()} tokens · costs are estimates.
              </p>
            </section>

            {/* Per-model results */}
            <ul className="space-y-2">
              {runs.map((run) => (
                <RunCard key={run.modelId} run={run} />
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCell({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-2">
      <div className="flex items-center gap-1 text-muted-foreground">
        {icon}
        <span className="text-[10px] uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-0.5 truncate text-xs font-medium text-foreground" title={value}>
        {value}
      </p>
    </div>
  );
}

function RunCard({ run }: { run: ModelRun }) {
  const [expanded, setExpanded] = useState(false);
  const statusColor =
    run.status === 'success'
      ? 'text-emerald-500'
      : run.status === 'error'
        ? 'text-rose-500'
        : 'text-muted-foreground';

  return (
    <li className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => run.status === 'success' && setExpanded((e) => !e)}
        disabled={run.status !== 'success'}
        className={cn(
          'w-full flex items-center justify-between gap-2 p-3 text-left',
          run.status === 'success' && 'cursor-pointer hover:bg-muted/50 transition-colors'
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              'h-2 w-2 shrink-0 rounded-full',
              run.status === 'success'
                ? 'bg-emerald-500'
                : run.status === 'error'
                  ? 'bg-rose-500'
                  : 'bg-muted-foreground/40 animate-pulse'
            )}
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{run.modelName}</p>
            <p className="text-[11px] text-muted-foreground">{run.provider}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className={cn('text-xs font-medium', statusColor)}>
            {run.status === 'success'
              ? formatLatency(run.latencyMs)
              : run.status === 'error'
                ? 'Error'
                : run.status === 'running'
                  ? 'Running…'
                  : 'Pending'}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {run.status === 'success' ? formatUsd(run.costUsd) : ''}
          </p>
        </div>
      </button>

      {expanded && run.status === 'success' && (
        <div className="border-t border-border px-3 py-2.5 space-y-2">
          <div className="flex gap-3 text-[11px] text-muted-foreground">
            <span>{run.totalTokens?.toLocaleString()} tokens</span>
            <span>{run.promptTokens?.toLocaleString()} prompt</span>
            <span>{run.completionTokens?.toLocaleString()} completion</span>
            <span>{run.content?.length.toLocaleString()} chars</span>
          </div>
          <div className="max-h-48 overflow-auto rounded-lg bg-muted/40 p-2.5">
            <p className="whitespace-pre-wrap text-xs text-foreground">{run.content}</p>
          </div>
        </div>
      )}

      {run.status === 'error' && (
        <div className="border-t border-border px-3 py-2 text-[11px] text-rose-500">{run.error}</div>
      )}
    </li>
  );
}

function friendlyName(modelId: string): string {
  const model = CURATED_MODELS.find((m) => m.id === modelId);
  return model?.name ?? modelId.split('/').pop() ?? modelId;
}
