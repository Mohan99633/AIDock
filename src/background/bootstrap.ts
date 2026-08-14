import { getAllSiteAdapters } from '~/adapters/registry/site-adapter-registry';

/**
 * Registers extension lifecycle behaviors.
 */
export function bootstrapBackgroundRuntime(): void {
  chrome.runtime.onInstalled.addListener(() => {
    const adapters = getAllSiteAdapters();
    console.info('[AIDock] Installed with supported adapters:', adapters.map((adapter) => adapter.id));
  });
}
