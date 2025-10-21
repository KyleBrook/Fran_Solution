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
  uiMode?: "redirect" | "embedded";
  returnUrl?: string; // obrigatório no embedded
};

const priceTable = {
  basic: {
    brl: { unit_amount: 1290, name: "EbookFy Basic (BRL)" },
    usd: { unit_amount: 300, name: "EbookFy Basic (USD)" },
  },
  pro: {
    brl: { unit_amount: 2490, name: "EbookFy Pro (BRL)" },
    usd: { unit_amount: 500, name: "EbookFy Pro (USD)" },
  },
} as const;

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

  // Autenticação do usuário
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
  const currency = (body.currency ?? "usd") as "brl" | "usd";
  const uiMode = body.uiMode ?? "redirect";

  const price = priceTable[planId]?.[currency];
  if (!price) {
    return new Response("Unsupported plan/currency", { status: 400, headers: corsHeaders });
  }

  const origin = new URL(req.url).origin;
  const success_url = body.successUrl || `${origin}/dashboard`;
  const cancel_url = body.cancelUrl || `${origin}/upgrade`;
  const return_url = body.returnUrl || `${origin}/dashboard`; // usado no embedded

  const baseParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: price.unit_amount,
          recurring: { interval: "month" },
          product_data: { name: price.name },
        },
      },
    ],
    customer_email: user.email || undefined,
    metadata: { user_id: user.id, plan_id: planId },
    subscription_data: { metadata: { user_id: user.id, plan_id: planId } },
  };

  let session: Stripe.Checkout.Session;

  if (uiMode === "embedded") {
    session = await stripe.checkout.sessions.create({
      ...baseParams,
      ui_mode: "embedded",
      return_url,
    });
    return new Response(
      JSON.stringify({ client_secret: session.client_secret }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } else {
    session = await stripe.checkout.sessions.create({
      ...baseParams,
      success_url,
      cancel_url,
    });
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});