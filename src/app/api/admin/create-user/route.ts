// src/app/api/admin/create-user/route.ts
import { NextResponse } from "next/server";
import { cookies as nextCookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

type Body = {
  email?: string;
  password?: string;
  orgId?: string;
  nome?: string;
  ruolo?: "admin" | "dispatcher" | "autista" | "meccanico" | "viewer";
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const orgId = String(body.orgId || "").trim();
    const ruolo = (body.ruolo || "autista").toLowerCase() as Body["ruolo"];
    const nome = String(body.nome || "").trim();

    if (!email) return bad("email mancante", 400);
    if (!orgId) return bad("orgId mancante", 400);

    // 1) Bypass dev (NON in prod)
    const adminSecret = process.env.ADMIN_API_SECRET || "";
    const devBypass = adminSecret && req.headers.get("x-admin-secret") === adminSecret;

    if (!devBypass) {
      const cookieStore = await nextCookies();
      const supabase = createRouteHandlerClient({ cookies: async () => cookieStore });

      const { data: auth, error: authErr } = await supabase.auth.getUser();
      if (authErr || !auth?.user) return bad("non autenticato", 401);

      const { data: me, error: meErr } = await supabase
        .from("users")
        .select("ruolo")
        .eq("org_id", orgId)
        .eq("email", auth.user.email)
        .maybeSingle();

      if (meErr) {
        console.error("permessi lookup error", meErr);
        return bad("errore verificando i permessi", 500);
      }
      const allowed = !!me && ["admin", "dispatcher"].includes((me.ruolo || "").toLowerCase());
      if (!allowed) return bad("permessi insufficienti", 403);
    }

    // 2) Admin client
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!url || !serviceKey) return bad("configurazione server mancante", 500);
    const admin = createClient(url, serviceKey);

    // 3) Crea utente Auth
    const pwd = password || strongPwd();
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email,
      password: pwd,
      email_confirm: true,
      user_metadata: { created_by: "rescuemanager-admin" },
    });
    if (cErr || !created?.user) {
      console.error("auth.admin.createUser error", cErr);
      return bad("creazione utente auth fallita", 500);
    }
    const authUserId = created.user.id;

    // 4) Collega profilo all’org (e imposta current_org)
    const { error: profErr } = await admin
      .from("profiles")
      .upsert({ id: authUserId, org_id: orgId, current_org: orgId }, { onConflict: "id" });

    // 5) Upsert nel DB applicativo
    const record = {
      org_id: orgId,
      nome: nome || email.split("@")[0],
      email,                 // già lowercase
      ruolo: ruolo || "autista",
      stato: "attivo",
      note: null as string | null,
      auth_user_id: authUserId,   // utile per join/audit
    };

    const { data: udata, error: uerr } = await admin
      .from("users")
      .upsert(record, { onConflict: "org_id,email" }) // <-- colonne reali, no funzioni
      .select("id")
      .maybeSingle();

    return NextResponse.json({
      id: authUserId,
      email,
      // password non più restituita in chiaro per sicurezza
      passwordGenerated: !password, // indica se è stata generata automaticamente
      orgId,
      appUserId: udata?.id ?? null,
      warnings: {
        profiles: !!profErr || undefined,
        users: !!uerr || undefined,
      },
    });
  } catch (e) {
    console.error("create-user route fatal", e);
    return bad("errore interno", 500);
  }
}

/* helpers */
function strongPwd(len = 12) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789!@#$%";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
function bad(msg: string, code = 400) {
  return NextResponse.json({ error: msg }, { status: code });
}