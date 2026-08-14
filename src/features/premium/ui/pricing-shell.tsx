import React from 'react';
import { Crown, Check, X, ExternalLink, KeyRound } from 'lucide-react';
import { PLAN_META, FREE_INCLUDED, PRO_INCLUDED, FREE_PROMPT_LIMIT, FREE_WORKSPACE_LIMIT } from '~/core/config/premium';
import { useLicenseStore } from '~/features/premium/state/license-store';
import { Button } from '~/shared/ui/button';
import { cn } from '~/shared/lib/cn';

/**
 * Popup pricing page — the primary "upgrade" surface for AIDock Pro.
 * Buy buttons open the owner-configured external checkout URL.
 */
export function PricingShell(): JSX.Element {
  const license = useLicenseStore();
  const [keyInput, setKeyInput] = React.useState('');
  const [redeemed, setRedeemed] = React.useState(false);

  const openCheckout = (): void => {
    if (license.checkoutUrl) {
      window.open(license.checkoutUrl, '_blank');
    }
  };

  const handleRedeem = async (): Promise<void> => {
    if (!keyInput.trim()) return;
    await license.redeem(keyInput.trim());
    setKeyInput('');
    setRedeemed(true);
    setTimeout(() => setRedeemed(false), 1500);
  };

  const isPro = license.tier === 'pro';

  return (
    <div className="flex flex-col h-full w-[380px] bg-background">
      <header className="p-4 pb-2">
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-500" />
          <h1 className="text-base font-semibold">AIDock Pro</h1>
        </div>
        {isPro && (
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <Check className="h-3 w-3" />
            Pro active on this device
          </span>
        )}
      </header>

      <div className="flex-1 overflow-auto px-4 pb-4 space-y-4">
        {/* Free */}
        <section className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">{PLAN_META.free.name}</h2>
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', !isPro ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
              {isPro ? 'Included in Pro' : 'Current plan'}
            </span>
          </div>
          <p className="mt-1 text-2xl font-bold">$0</p>
          <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
            {FREE_INCLUDED.map((feat) => (
              <li key={feat} className="flex gap-2">
                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                {feat}
              </li>
            ))}
            <li className="flex gap-2 text-rose-500/80">
              <X className="h-3.5 w-3.5 shrink-0" />
              Unlimited prompts & workspaces
            </li>
            <li className="flex gap-2 text-rose-500/80">
              <X className="h-3.5 w-3.5 shrink-0" />
              Model Comparison
            </li>
          </ul>
        </section>

        {/* Pro */}
        <section className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">{PLAN_META.pro.name}</h2>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Best value</span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-2xl font-bold">${PLAN_META.pro.priceLifetimeUsd}</p>
            <p className="text-xs text-muted-foreground">one-time, or ${PLAN_META.pro.priceMonthlyUsd}/mo</p>
          </div>
          <ul className="mt-3 space-y-1.5 text-xs text-foreground/90">
            {PRO_INCLUDED.map((feat) => (
              <li key={feat} className="flex gap-2">
                <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                {feat}
              </li>
            ))}
          </ul>

          {!isPro && (
            <div className="mt-4 space-y-2">
              <Button variant="primary" className="w-full" onClick={openCheckout}>
                <ExternalLink className="h-4 w-4" />
                Get AIDock Pro
              </Button>
              {!license.checkoutUrl && (
                <p className="text-center text-[11px] text-muted-foreground">
                  Checkout link not configured by the developer yet.
                </p>
              )}
              <div className="flex gap-2 pt-1">
                <div className="relative flex-1">
                  <KeyRound className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="Have a license key?"
                    className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-xs outline-none focus:border-primary"
                  />
                </div>
                <Button variant="secondary" size="sm" onClick={() => void handleRedeem()} disabled={!keyInput.trim()}>
                  {redeemed ? 'Done' : 'Redeem'}
                </Button>
              </div>
            </div>
          )}

          {isPro && (
            <div className="mt-4 rounded-lg bg-background/50 p-2.5 text-xs text-muted-foreground">
              Free limits ({FREE_PROMPT_LIMIT} prompts / {FREE_WORKSPACE_LIMIT} workspaces) are lifted.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}