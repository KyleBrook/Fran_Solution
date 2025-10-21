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
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "OPTIONS, POST",
};

type Body = {
  planId: "basic" | "pro";
  currency?: "brl" | "usd";
  successUrl?: string;
  cancelUrl?: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

  if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return new Response("Missing server configuration", { status: 500, headers: corsHeaders });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });

  // Autenticar usuário via token do supabase-js enviado no Authorization
  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  const body = (await req.json()) as Body;
  const planId = body.planId;
  const currency = body.currency ?? "usd";

  // Seleciona price ID conforme plano e moeda
  const priceMap = {
    basic: {
      brl: Deno.env.get("STRIPE_PRICE_BASIC_BRL"),
      usd: Deno.env.get("STRIPE_PRICE_BASIC_USD"),
    },
    pro: {
      brl: Deno.env.get("STRIPE_PRICE_PRO_BRL"),
      usd: Deno.env.get("STRIPE_PRICE_PRO_USD"),
    },
  } as const;

  const priceId = priceMap[planId]?.[currency];
  if (!priceId) {
    return new Response("Price not configured", { status: 400, headers: corsHeaders });
  }

  const origin = new URL(req.url).origin;
  const success_url = body.successUrl || `${origin}/dashboard`;
  const cancel_url = body.cancelUrl || `${origin}/upgrade`;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url,
    cancel_url,
    customer_email: user.email || undefined,
    // Ajuda o webhook a mapear o usuário e o plano
    metadata: { user_id: user.id, plan_id: planId },
    subscription_data: {
      metadata: { user_id: user.id, plan_id: planId },
    },
  });

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});