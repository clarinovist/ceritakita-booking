'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SystemSettings, SettingsContextType } from './types/settings';
import { SETTINGS_CACHE } from './constants';

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

/**
 * Default settings fallback
 */
const DEFAULT_SETTINGS: SystemSettings = {
  // Branding & SEO
  site_name: 'Cerita Kita',
  site_logo: '/images/default-logo.png',
  meta_title: 'Cerita Kita - Professional Photography Services',
  meta_description: 'Professional photography services in Jakarta.',

  // Core Identity
  whatsapp_admin_number: '+62 812 3456 7890',
  business_email: 'info@ceritakita.studio',
  business_phone: '+62 812 3456 7890',
  business_address: 'Jalan Raya No. 123, Jakarta',

  // Finance
  bank_name: 'BCA',
  bank_number: '1234567890',
  bank_holder: 'CERITA KITA',
  invoice_notes: '',
  requires_deposit: false,
  deposit_amount: 0,
  tax_rate: 0,

  // Rules
  min_booking_notice: 1,
  max_booking_ahead: 90,

  // Templates
  whatsapp_message_template: ''
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async (skipCache = false) => {
    try {
      // Check cache first (unless explicitly skipped)
      if (!skipCache && typeof window !== 'undefined') {
        const cached = localStorage.getItem(SETTINGS_CACHE.KEY);
        const cacheTime = localStorage.getItem(SETTINGS_CACHE.TIME_KEY);

        if (cached && cacheTime) {
          const age = Date.now() - parseInt(cacheTime);

          // Use cache if less than TTL (5 minutes)
          if (age < SETTINGS_CACHE.TTL) {
            const parsedSettings = JSON.parse(cached) as SystemSettings;
            setSettings(parsedSettings);
            setLoading(false);

            // Fetch in background to update cache
            fetchSettingsFromAPI();
            return;
          }
        }
      }

      // Fetch from API
      await fetchSettingsFromAPI();
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      // Use defaults if all fails
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettingsFromAPI = async () => {
    try {
      const res = await fetch('/api/settings', {
        // Respect browser cache
        cache: 'default'
      });

      if (res.ok) {
        const data = await res.json() as SystemSettings;
        setSettings(data);

        // Cache in localStorage (client-side only)
        if (typeof window !== 'undefined') {
          localStorage.setItem(SETTINGS_CACHE.KEY, JSON.stringify(data));
          localStorage.setItem(SETTINGS_CACHE.TIME_KEY, Date.now().toString());
        }
      } else {
        throw new Error('Failed to fetch settings');
      }
    } catch (error) {
      console.error('API fetch error:', error);
      // If we have no settings yet, use defaults
      if (!settings) {
        setSettings(DEFAULT_SETTINGS);
      }
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const refreshSettings = async () => {
    setLoading(true);
    // Clear cache and force fresh fetch
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SETTINGS_CACHE.KEY);
      localStorage.removeItem(SETTINGS_CACHE.TIME_KEY);
    }
    await fetchSettings(true);
    setLoading(false);
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}