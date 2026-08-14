import React, { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { CreditCard, KeyRound, CheckCircle2, Cloud, Download, Upload } from 'lucide-react';
import type { ThemeMode } from '~/core/config/theme';
import { PLAN_META, FREE_INCLUDED, PRO_INCLUDED } from '~/core/config/premium';
import { useLicenseStore } from '~/features/premium/state/license-store';
import { isPro } from '~/features/premium/lib/gating';
import { exportBackupJson, importBackup, type ImportMode } from '~/features/sync/lib/sync-engine';
import { getSyncMetadata, setSyncMetadata } from '~/infrastructure/storage/sync-store';
import { Button } from '~/shared/ui/button';

type SettingsShellProps = {
  themeMode: ThemeMode;
  onThemeModeChange: (mode: ThemeMode) => void;
};

export function SettingsShell({ themeMode, onThemeModeChange }: SettingsShellProps): JSX.Element {
  const licenseStore = useLicenseStore();
  const [keyInput, setKeyInput] = React.useState('');
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [autoSync, setAutoSync] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void licenseStore.hydrate();
    void loadSyncMetadata();
  }, [licenseStore]);

  const loadSyncMetadata = async (): Promise<void> => {
    const meta = await getSyncMetadata();
    setLastSyncAt(meta.lastSyncAt);
    setAutoSync(meta.autoSyncEnabled);
  };

  const handleSyncNow = async (): Promise<void> => {
    await setSyncMetadata({ lastSyncAt: Date.now(), autoSyncEnabled: autoSync });
    setLastSyncAt(Date.now());
    setSyncMessage('Sync complete.');
  };

  const handleToggleAutoSync = async (next: boolean): Promise<void> => {
    setAutoSync(next);
    await setSyncMetadata({ lastSyncAt, autoSyncEnabled: next });
  };

  const handleExport = async (): Promise<void> => {
    const json = await exportBackupJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aidock-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSyncMessage('Backup downloaded.');
  };

  const handleImportFile = async (file: File): Promise<void> => {
    const raw = await file.text();
    try {
      const result = await importBackup(raw, importMode);
      setSyncMessage(result.message);
    } catch (err) {
      setSyncMessage(err instanceof Error ? err.message : 'Import failed.');
    }
  };

  const handleThemeChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    onThemeModeChange(event.target.value as ThemeMode);
  };

  const handleRedeem = async () => {
    if (!keyInput.trim()) return;
    try {
      // In a real app with an external checkout (Gumroad/Paddle), this would call
      // an API to verify `keyInput`. For this isolated extension, we assume valid
      // and immediately store it + unlock Pro.
      await licenseStore.redeem(keyInput.trim());
      setKeyInput('');
    } catch (err) {
      console.error('Failed to redeem license', err);
    }
  };

  if (!licenseStore.hydrated) return <div />;

  const prodIsPro = isPro(licenseStore.tier);

  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-background p-8 text-foreground pb-20">
      <h1 className="text-2xl font-semibold">AIDock Settings</h1>
      <p className="mt-2 text-sm text-muted-foreground">Configure appearance, billing, and advanced behavior.</p>

      {/* Theme Settings */}
      <section className="mt-8 rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-base font-semibold mb-4">Appearance</h2>
        <label className="block text-sm font-medium" htmlFor="theme-mode">
          Theme Mode
        </label>
        <select
          id="theme-mode"
          className="mt-2 h-10 w-full max-w-sm rounded-lg border border-border bg-background px-3 text-sm focus:border-primary outline-none"
          value={themeMode}
          onChange={handleThemeChange}
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </section>

      {/* Licensing & Plan */}
      <section className="mt-8 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">Plan & Billing</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Current active plan: <strong className="text-foreground">{PLAN_META[licenseStore.tier].name}</strong>
          </p>
        </div>

        <div className="p-5 grid gap-6 md:grid-cols-2">
          {/* Free Tier Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{PLAN_META.free.name}</h3>
              <p className="text-2xl font-bold mt-1">$0</p>
              <p className="text-sm text-muted-foreground">Lifetime</p>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {FREE_INCLUDED.map((feat) => (
                <li key={feat} className="flex gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  {feat}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro Tier Info */}
          <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4 relative">
            {prodIsPro && (
              <div className="absolute top-4 right-4 bg-emerald-500/10 text-emerald-500 text-xs px-2 py-0.5 rounded-full font-medium flex gap-1 items-center">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Active
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold">{PLAN_META.pro.name}</h3>
              <p className="text-2xl font-bold mt-1">${PLAN_META.pro.priceLifetimeUsd}</p>
              <p className="text-sm text-muted-foreground mt-0.5">One-time payment</p>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {PRO_INCLUDED.map((feat) => (
                <li key={feat} className="flex gap-2 text-foreground/90">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  {feat}
                </li>
              ))}
            </ul>

            {!prodIsPro && (
              <div className="pt-4 border-t border-primary/10 mt-4 space-y-3">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => {
                    if (licenseStore.checkoutUrl) {
                      window.open(licenseStore.checkoutUrl, '_blank');
                    } else {
                      alert('Checkout URL not configured by developer yet.');
                    }
                  }}
                >
                  Upgrade to Pro
                </Button>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Paste license key..."
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                      className="w-full h-9 pl-9 pr-3 rounded-md border border-primary/20 bg-background text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <Button variant="secondary" size="sm" onClick={handleRedeem} disabled={!keyInput.trim()}>
                    Redeem
                  </Button>
                </div>
              </div>
            )}

            {prodIsPro && (
              <div className="pt-4 border-t border-primary/10 mt-4">
                <p className="text-sm font-medium">License Key</p>
                <p className="text-xs text-muted-foreground font-mono mt-1 blur-sm hover:blur-none transition-all cursor-crosshair">
                  {licenseStore.licenseKey || 'N/A'}
                </p>
                <Button variant="secondary" size="sm" className="mt-3" onClick={() => licenseStore.setTier('free')}>
                  Remove License
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Sync & Backup */}
      <section className="mt-8 rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Cloud className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">Sync & Backup</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Back up your data to a JSON file, or restore from one. Cloud sync mirrors small metadata via your Chrome account.
        </p>

        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Automatic sync</p>
                <p className="text-xs text-muted-foreground">
                  {lastSyncAt
                    ? `Last synced ${new Date(lastSyncAt).toLocaleString()}`
                    : 'Never synced'}
                </p>
              </div>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => void handleToggleAutoSync(e.target.checked)}
                  className="h-4 w-4 rounded accent-primary"
                />
                Enabled
              </label>
            </div>
            <Button variant="secondary" onClick={() => void handleSyncNow()}>
              Sync Now
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="radio"
                  name="import-mode"
                  value="merge"
                  checked={importMode === 'merge'}
                  onChange={() => setImportMode('merge')}
                  className="h-3.5 w-3.5 accent-primary"
                />
                Merge (keep newest)
              </label>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="radio"
                  name="import-mode"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="h-3.5 w-3.5 accent-primary"
                />
                Replace
              </label>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => void handleExport()}>
                <Download className="h-4 w-4" />
                Export Backup
              </Button>
              <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4" />
                Import
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleImportFile(file);
                  e.target.value = '';
                }}
              />
            </div>
          </div>
        </div>

        {syncMessage && (
          <p className="mt-4 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-foreground/90">
            {syncMessage}
          </p>
        )}
      </section>
    </main>
  );
}