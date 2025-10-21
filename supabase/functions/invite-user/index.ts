/* eslint-disable */
// @ts-ignore: remote import for Deno Edge Function
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore: remote import for Deno Edge Function
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "OPTIONS, POST",
};

// Lista de e-mails autorizados a enviar convites (admins)
const ALLOWED_INVITER_EMAILS = ["alabastrotech@gmail.com"];

type Body = {
  email: string;
  redirectTo?: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response("Missing server configuration", { status: 500, headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization") ?? "";

  // Cliente autenticado para identificar quem está chamando
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email || !ALLOWED_INVITER_EMAILS.includes(user.email.toLowerCase())) {
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  const body = (await req.json().catch(() => ({}))) as Body;
  const email = (body.email || "").trim().toLowerCase();
  const origin = new URL(req.url).origin;
  const redirectTo = body.redirectTo || `${origin}/login`;

  if (!isValidEmail(email)) {
    return new Response(JSON.stringify({ error: "Invalid email" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Cliente admin para enviar o convite
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, user: data.user }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});