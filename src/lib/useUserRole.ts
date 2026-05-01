"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export type OrgRole = "owner" | "admin" | "manager" | "operator" | "viewer" | null;

interface RoleState {
  role: OrgRole;
  orgId: string | null;
  loading: boolean;
  isOwner: boolean;
  isAdminOrOwner: boolean;
}

/**
 * Hook condiviso per il role-based access control sul dashboard.
 *
 * Risolve il role dell'utente nell'org corrente:
 *  1. profiles.current_org per capire quale org
 *  2. org_members.role per il role effettivo
 *
 * NON usa fallback hardcoded "owner" — se manca la membership ritorna null.
 */
export function useUserRole(): RoleState {
  const [role, setRole] = useState<OrgRole>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const supabase = supabaseBrowser();
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (mounted) { setRole(null); setOrgId(null); setLoading(false); }
          return;
        }

        // 1. profiles.current_org
        const { data: profile } = await supabase
          .from("profiles")
          .select("current_org")
          .eq("id", user.id)
          .maybeSingle();

        let currentOrg: string | null = (profile?.current_org as string) || null;

        // 2. fallback: prima membership
        if (!currentOrg) {
          const { data: mem } = await supabase
            .from("org_members")
            .select("org_id")
            .eq("user_id", user.id)
            .limit(1)
            .maybeSingle();
          currentOrg = (mem?.org_id as string) || null;
        }

        if (!currentOrg) {
          if (mounted) { setRole(null); setOrgId(null); setLoading(false); }
          return;
        }

        // 3. role in quella org
        const { data: membership } = await supabase
          .from("org_members")
          .select("role")
          .eq("org_id", currentOrg)
          .eq("user_id", user.id)
          .maybeSingle();

        if (mounted) {
          setOrgId(currentOrg);
          setRole((membership?.role as OrgRole) || null);
          setLoading(false);
        }
      } catch (err) {
        console.error("[useUserRole] error:", err);
        if (mounted) { setRole(null); setOrgId(null); setLoading(false); }
      }
    })();
    return () => { mounted = false; };
  }, []);

  return {
    role,
    orgId,
    loading,
    isOwner: role === "owner",
    isAdminOrOwner: role === "owner" || role === "admin",
  };
}
