'use client';

/**
 * useOrgFeatures — legge org_settings.key='features' e org_settings.key='company'
 *                  + flag access da orgs (web_access_enabled / desktop_access_enabled)
 *
 * I feature flag sono salvati dall'admin in `org_settings.key='features'` JSONB.
 * Vedi admin-panel/src/components/client/ClientControlsPanel.tsx per la lista completa.
 *
 * Esempio uso:
 *   const { isEnabled, loading } = useOrgFeatures();
 *   if (isEnabled('ai_descriptions')) <AIDescButton />
 */

import { useEffect, useState, useCallback } from 'react';
import { supabaseBrowser } from './supabase-browser';

export type FeatureFlag =
  | 'ai_validation' | 'ai_descriptions' | 'ai_assist' | 'ai_image_recognition'
  | 'sdi_test_mode' | 'sdi_auto_send'
  | 'rvfu_aci_vpn' | 'rvfu_auto_submit' | 'rentri_polling' | 'rentri_auto_movements'
  | 'marketplace_enabled' | 'marketplace_ebay' | 'marketplace_subito'
  | 'gps_tracking_enabled' | 'driver_app_enabled' | 'geofencing'
  | 'email_notifications' | 'push_notifications' | 'whatsapp_notifications'
  | 'twofa_required' | 'audit_log_visible' | 'remote_control_enabled'
  | 'beta_features';

// Default features (se org non ha settato esplicitamente nulla).
// Allineati a ClientControlsPanel.tsx defaults.
const DEFAULT_FEATURES: Record<FeatureFlag, boolean> = {
  ai_validation: true,
  ai_descriptions: true,
  ai_assist: true,
  ai_image_recognition: false,
  sdi_test_mode: false,
  sdi_auto_send: true,
  rvfu_aci_vpn: false,
  rvfu_auto_submit: false,
  rentri_polling: true,
  rentri_auto_movements: false,
  marketplace_enabled: false,
  marketplace_ebay: false,
  marketplace_subito: false,
  gps_tracking_enabled: true,
  driver_app_enabled: true,
  geofencing: false,
  email_notifications: true,
  push_notifications: true,
  whatsapp_notifications: false,
  twofa_required: false,
  audit_log_visible: false,
  remote_control_enabled: true,
  beta_features: false,
};

// Mapping feature → modulo richiesto. Se modulo OFF la feature è auto-false.
const FEATURE_REQUIRES_MODULE: Partial<Record<FeatureFlag, string>> = {
  rvfu_aci_vpn: 'rvfu',
  rvfu_auto_submit: 'rvfu',
  ai_image_recognition: 'rvfu',
  rentri_polling: 'rentri',
  rentri_auto_movements: 'rentri',
  sdi_test_mode: 'fatturazione',
  sdi_auto_send: 'fatturazione',
  marketplace_ebay: 'marketplace',
  marketplace_subito: 'marketplace',
  ai_descriptions: 'ricambi',
  geofencing: 'tracking',
};

interface OrgFeaturesState {
  loading: boolean;
  error: string | null;
  orgId: string | null;
  features: Record<string, boolean>;
  modules: string[];
  webAccessEnabled: boolean;
  desktopAccessEnabled: boolean;
}

// Cache singleton per evitare fetch ripetuti nella stessa sessione
let cache: OrgFeaturesState | null = null;
const listeners = new Set<() => void>();
function notify() { for (const l of listeners) l(); }

async function loadFeatures(): Promise<OrgFeaturesState> {
  const supabase = supabaseBrowser();
  const state: OrgFeaturesState = {
    loading: false, error: null, orgId: null,
    features: { ...DEFAULT_FEATURES }, modules: [],
    webAccessEnabled: true, desktopAccessEnabled: true,
  };

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return state;

    const { data: profile } = await supabase
      .from('profiles')
      .select('current_org')
      .eq('id', user.id)
      .maybeSingle();

    let orgId = profile?.current_org as string | null;
    if (!orgId) {
      const { data: mem } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();
      orgId = mem?.org_id || null;
    }
    if (!orgId) return state;

    state.orgId = orgId;

    const [{ data: org }, { data: settings }] = await Promise.all([
      supabase.from('orgs')
        .select('web_access_enabled, desktop_access_enabled, desktop_modules')
        .eq('id', orgId).maybeSingle(),
      supabase.from('org_settings')
        .select('value')
        .eq('org_id', orgId)
        .eq('key', 'features')
        .maybeSingle(),
    ]);

    if (org) {
      state.webAccessEnabled = org.web_access_enabled !== false;
      state.desktopAccessEnabled = org.desktop_access_enabled !== false;
      state.modules = Array.isArray(org.desktop_modules) ? org.desktop_modules : [];
    }
    if (settings?.value && typeof settings.value === 'object') {
      state.features = { ...DEFAULT_FEATURES, ...(settings.value as Record<string, boolean>) };
    }
    return state;
  } catch (e: any) {
    state.error = e.message || 'load error';
    return state;
  }
}

export function useOrgFeatures() {
  const [state, setState] = useState<OrgFeaturesState>(
    cache || { loading: true, error: null, orgId: null, features: { ...DEFAULT_FEATURES }, modules: [], webAccessEnabled: true, desktopAccessEnabled: true }
  );

  useEffect(() => {
    let mounted = true;
    if (!cache) {
      loadFeatures().then(s => {
        cache = s;
        if (mounted) setState(s);
        notify();
      });
    }
    const update = () => { if (mounted && cache) setState(cache); };
    listeners.add(update);
    return () => { mounted = false; listeners.delete(update); };
  }, []);

  const isEnabled = useCallback((flag: FeatureFlag): boolean => {
    // Modulo richiesto?
    const requiredModule = FEATURE_REQUIRES_MODULE[flag];
    if (requiredModule && !state.modules.includes(requiredModule)) return false;
    const v = state.features[flag];
    return v === undefined ? DEFAULT_FEATURES[flag] : v === true;
  }, [state.features, state.modules]);

  const hasModule = useCallback((module: string): boolean => {
    return state.modules.includes(module);
  }, [state.modules]);

  const refresh = useCallback(async () => {
    cache = null;
    const s = await loadFeatures();
    cache = s;
    setState(s);
    notify();
  }, []);

  return {
    loading: state.loading,
    error: state.error,
    orgId: state.orgId,
    features: state.features,
    modules: state.modules,
    webAccessEnabled: state.webAccessEnabled,
    desktopAccessEnabled: state.desktopAccessEnabled,
    isEnabled,
    hasModule,
    refresh,
  };
}

// Server-side: helper per leggere features in Server Components / API routes
export async function fetchOrgFeaturesServer(orgId: string, supabaseAdmin: any) {
  if (!orgId) return null;
  const [{ data: org }, { data: settings }] = await Promise.all([
    supabaseAdmin.from('orgs')
      .select('web_access_enabled, desktop_access_enabled, desktop_modules')
      .eq('id', orgId).maybeSingle(),
    supabaseAdmin.from('org_settings')
      .select('value').eq('org_id', orgId).eq('key', 'features').maybeSingle(),
  ]);
  const features = { ...DEFAULT_FEATURES, ...((settings?.value as Record<string, boolean>) || {}) };
  return {
    webAccessEnabled: org?.web_access_enabled !== false,
    desktopAccessEnabled: org?.desktop_access_enabled !== false,
    modules: org?.desktop_modules || [],
    features,
    isEnabled(flag: FeatureFlag) {
      const req = FEATURE_REQUIRES_MODULE[flag];
      if (req && !(org?.desktop_modules || []).includes(req)) return false;
      return features[flag] === true;
    },
  };
}
