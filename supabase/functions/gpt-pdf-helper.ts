// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type RequestBody = {
  title?: string;
  subtitle?: string;
  body?: string;
  language?: string; // e.g., 'pt-BR'
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "OPENAI_API_KEY not set" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { title, subtitle, body, language = "pt-BR" } = (await req.json()) as RequestBody;

  const userText = [
    title ? `Título: ${title}` : undefined,
    subtitle ? `Subtítulo: ${subtitle}` : undefined,
    body ? `Texto base:\n${body}` : undefined,
  ]
    .filter(Boolean)
    .join("\n\n");

  const systemPrompt = `Você é um assistente que organiza conteúdo para um PDF com capa (título/subtítulo) e corpo do texto.
Responda estritamente em JSON válido, sem comentários, sem markdown, no idioma solicitado.
Formato de saída:
{
  "title": "string",
  "subtitle": "string",
  "paragraphs": ["string", "string", ...]
}
Regras:
- Melhore e normalize título e subtítulo mantendo o sentido do usuário (no idioma alvo).
- Reestruture o corpo em parágrafos claros e coesos (sem listas a não ser que seja indispensável).
- Não inclua quebras manuais além da divisão por parágrafos.
- Mantenha o idioma: ${language}.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.6,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content:
            userText ||
            `Gere um conteúdo de exemplo curto em ${language} (3 a 6 parágrafos) sobre um tema motivacional cristão.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return new Response(JSON.stringify({ error: "OpenAI error", detail: text }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const result = await response.json();
  const content: string = result?.choices?.[0]?.message?.content ?? "";

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (_e) {
    parsed = {
      title: title || "Documento",
      subtitle: subtitle || "",
      paragraphs: [content || body || ""].filter((x) => !!x),
    };
  }

  return new Response(JSON.stringify(parsed), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});