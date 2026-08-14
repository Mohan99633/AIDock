import { create } from 'zustand';

import {
  CHECKOUT_URL_STORAGE_KEY,
  DEFAULT_CHECKOUT_URL,
  LICENSE_STORAGE_KEY,
  PREMIUM_STORAGE_KEY,
  type PlanTier
} from '~/core/config/premium';
import { getLocalValue, setLocalValue } from '~/infrastructure/storage/local-store';

type LicenseState = {
  tier: PlanTier;
  licenseKey: string;
  checkoutUrl: string;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  /** Sets the current tier directly (used by the redeem flow). */
  setTier: (tier: PlanTier) => Promise<void>;
  /** Stores a license key and marks the device as Pro. */
  redeem: (licenseKey: string) => Promise<void>;
  /** Persists the owner-configured checkout URL. */
  setCheckoutUrl: (url: string) => Promise<void>;
};

/**
 * Manages the AIDock Pro license state: current tier, redeemed license key,
 * and the external checkout URL. All persisted in local Chrome storage.
 */
export const useLicenseStore = create<LicenseState>((set) => ({
  tier: 'free',
  licenseKey: '',
  checkoutUrl: DEFAULT_CHECKOUT_URL,
  hydrated: false,
  async hydrate() {
    const [tier, licenseKey, checkoutUrl] = await Promise.all([
      getLocalValue<PlanTier>(PREMIUM_STORAGE_KEY),
      getLocalValue<string>(LICENSE_STORAGE_KEY),
      getLocalValue<string>(CHECKOUT_URL_STORAGE_KEY)
    ]);
    set({
      tier: tier === 'pro' ? 'pro' : 'free',
      licenseKey: licenseKey ?? '',
      checkoutUrl: checkoutUrl ?? DEFAULT_CHECKOUT_URL,
      hydrated: true
    });
  },
  async setTier(tier) {
    await setLocalValue(PREMIUM_STORAGE_KEY, tier);
    set({ tier });
  },
  async redeem(licenseKey) {
    const trimmed = licenseKey.trim();
    await Promise.all([
      setLocalValue(PREMIUM_STORAGE_KEY, 'pro'),
      setLocalValue(LICENSE_STORAGE_KEY, trimmed)
    ]);
    set({ tier: 'pro', licenseKey: trimmed });
  },
  async setCheckoutUrl(url) {
    const trimmed = url.trim();
    await setLocalValue(CHECKOUT_URL_STORAGE_KEY, trimmed);
    set({ checkoutUrl: trimmed });
  }
}));