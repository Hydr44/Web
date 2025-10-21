import { stripe } from "./stripe";
import { supabaseServer } from "./supabase-server";

export async function ensureStripeCustomer(userId: string, email?: string | null) {
  const supabase = await supabaseServer();

  // 1) leggi l’eventuale customer esistente
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("stripe_customer_id, email")
    .eq("id", userId)
    .single();

  if (error) throw new Error("Impossibile leggere il profilo");

  const customerId = profile?.stripe_customer_id ?? null;
  const effectiveEmail = email ?? profile?.email ?? undefined;

  // 2) se già c’è, ritorna
  if (customerId) return customerId;

  // 3) crea Customer su Stripe
  const customer = await stripe.customers.create({
    email: effectiveEmail,
    metadata: { user_id: userId },
  });

  // 4) salva nel profilo
  const { error: upErr } = await supabase
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId);

  if (upErr) throw new Error("Impossibile salvare stripe_customer_id nel profilo");

  return customer.id;
}
