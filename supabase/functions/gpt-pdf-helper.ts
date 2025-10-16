// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "OPTIONS, POST",
};

type RequestBody = {
  title?: string;
  subtitle?: string;
  body?: string;
  language?: string; // e.g., 'pt-BR'
};

function createFallbackContent({
  title,
  subtitle,
  body,
  language = "pt-BR",
}: RequestBody) {
  const normTitle = (title || "Documento").toString().trim();
  const normSubtitle = (subtitle || "").toString().trim();
  const paragraphs =
    (body || "")
      .split(/\n\s*\n/g)
      .map((p) => p.trim())
      .filter(Boolean);
  const defaultParas =
    language.startsWith("pt")
      ? [
          "Este é um conteúdo de exemplo gerado localmente quando a IA não está disponível.",
          "Adicione seu texto no campo indicado para que possamos organizá-lo automaticamente em parágrafos.",
          "Você pode imprimir o PDF ou ajustar tamanhos de título, subtítulo e corpo conforme preferir.",
        ]
      : [
          "This is a locally generated sample when AI is unavailable.",
          "Add your text and we'll automatically split it into clear paragraphs.",
          "You can print the PDF or adjust title, subtitle and body sizes as you like.",
        ];
  return {
    title: normTitle,
    subtitle: normSubtitle,
    paragraphs: paragraphs.length ? paragraphs : defaultParas,
  };
}

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

  const requestData = (await req.json()) as RequestBody;
  const { title, subtitle, body, language = "pt-BR" } = requestData || {};

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  const hasKey = !!apiKey && apiKey.length > 0;

  if (!hasKey) {
    const fallback = createFallbackContent({ title, subtitle, body, language });
    return new Response(JSON.stringify(fallback), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
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
      const fallback = createFallbackContent({ title, subtitle, body, language });
      return new Response(JSON.stringify(fallback), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const content: string = result?.choices?.[0]?.message?.content ?? "";

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (_e) {
      parsed = createFallbackContent({ title, subtitle, body, language });
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (_err) {
    const fallback = createFallbackContent({ title, subtitle, body, language });
    return new Response(JSON.stringify(fallback), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});