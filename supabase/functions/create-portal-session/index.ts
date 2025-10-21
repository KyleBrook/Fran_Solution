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
  returnUrl?: string;
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

  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  const body = (await req.json().catch(() => ({}))) as Body;
  const origin = new URL(req.url).origin;
  const return_url = body.returnUrl || `${origin}/dashboard`;

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });

  // Localiza o customer pelo e-mail (depois do primeiro pagamento, o cliente já existe).
  const customers = await stripe.customers.list({ email: user.email, limit: 1 });
  const customer = customers.data[0];

  if (!customer) {
    // Usuário ainda não possui assinatura no Stripe
    return new Response(JSON.stringify({ error: "Nenhuma assinatura encontrada para este usuário." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customer.id,
    return_url,
  });

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});