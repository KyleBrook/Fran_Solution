/* eslint-disable */
// @ts-ignore: remote import for Deno Edge Function
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore: remote import for Deno Edge Function
import Stripe from "https://esm.sh/stripe@12.18.0?target=deno";
// @ts-ignore: remote import for Deno Edge Function
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
  "Access-Control-Allow-Methods": "OPTIONS, POST",
};

function toISOStringOrNull(ts?: number | null) {
  return ts ? new Date(ts * 1000).toISOString() : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
  const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response("Missing server configuration", { status: 500, headers: corsHeaders });
  }

  const bodyText = await req.text();
  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return new Response("Missing signature", { status: 400, headers: corsHeaders });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(bodyText, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return new Response(`Invalid signature: ${(err as Error).message}`, {
      status: 400,
      headers: corsHeaders,
    });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Util para inserir um registro de assinatura para o usuário (mantemos histórico)
  async function upsertSubscriptionFromStripeSub(sub: Stripe.Subscription) {
    const metadata = sub.metadata || {};
    const userId = (metadata["user_id"] as string) || "";
    const planId = (metadata["plan_id"] as string) || "";

    if (!userId) return;

    // status Stripe -> status interno (mantemos string para simplicidade)
    const status = sub.status;

    const expires_at = toISOStringOrNull(sub.current_period_end);
    const trial_ends_at = toISOStringOrNull(sub.trial_end);

    await supabaseAdmin.from("subscriptions").insert({
      user_id: userId,
      status,
      product_id: planId || null, // "basic" | "pro" (definido no checkout)
      starts_at: toISOStringOrNull(sub.current_period_start) || new Date().toISOString(),
      expires_at,
      trial_ends_at,
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          await upsertSubscriptionFromStripeSub(sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await upsertSubscriptionFromStripeSub(sub);
        break;
      }
      default:
        // Ignorar outros eventos
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(`Webhook error: ${(err as Error).message}`, {
      status: 500,
      headers: corsHeaders,
    });
  }
});