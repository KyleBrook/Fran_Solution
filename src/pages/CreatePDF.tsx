import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PDFGenerator, { PDFData } from "@/components/PDFGenerator";
import { showError, showLoading, showSuccess, dismissToast } from "@/utils/toast";

const sizeOptionsTitle = [40, 48, 56, 64, 72, 80];
const sizeOptionsSubtitle = [20, 22, 24, 28, 32, 36];
const sizeOptionsBody = [16, 18, 20, 22, 24, 26];

const DEFAULTS = {
  coverBackground:
    "https://nolrnrwzeurbimcnjlwm.supabase.co/storage/v1/object/public/Luma__Fran/Background.png",
  logo:
    "https://nolrnrwzeurbimcnjlwm.supabase.co/storage/v1/object/public/Luma__Fran/Logo%20EDD.PNG",
  contentBackground:
    "https://nolrnrwzeurbimcnjlwm.supabase.co/storage/v1/object/public/Luma__Fran/fundo%20imagens%20luma.png",
  pageTopRightLogo:
    "https://nolrnrwzeurbimcnוואך.supabase.co/storage/v1/object/public/Luma__Fran/Logo%20EDD.PNG"
      .replace("wartz.supabase.co", "wzeurbimcnjlwm.supabase.co"),
};

const CreatePDF: React.FC = () => {
  const [title, setTitle] = React.useState<string>("Meu Título");
  const [subtitle, setSubtitle] = React.useState<string>("Meu Subtítulo opcional");

  // Novos campos de assinatura (canto inferior direito da capa)
  const [signatureHeadline, setSignatureHeadline] = React.useState<string>("");
  const [signatureSubline, setSignatureSubline] = React.useState<string>("");

  const [body, setBody] = React.useState<string>(
    [
      "Cole aqui o texto geral do PDF.",
      "Separe parágrafos com uma linha em branco para melhor formatação.",
      "Use o seletor ao lado para ajustar o tamanho do texto.",
    ].join("\n\n"),
  );

  const [titleSize, setTitleSize] = React.useState<number>(64);
  const [subtitleSize, setSubtitleSize] = React.useState<number>(28);
  const [bodySize, setBodySize] = React.useState<number>(20);
  const [loadingAI, setLoadingAI] = React.useState<boolean>(false);

  const blocks = React.useMemo<React.ReactNode[]>(() => {
    const items: React.ReactNode[] = [];
    if (title.trim()) {
      items.push(
        <h1 key="title" style={{ fontSize: `${titleSize}px` }}>
          {title}
        </h1>,
      );
    }
    if (subtitle.trim()) {
      items.push(
        <h2 key="subtitle" style={{ fontSize: `${subtitleSize}px` }}>
          {subtitle}
        </h2>,
      );
    }

    const paragraphs = body
      .split(/\n\s*\n/g)
      .map((p) => p.trim())
      .filter(Boolean);

    if (paragraphs.length === 0) {
      items.push(
        <p key="placeholder" style={{ fontSize: `${bodySize}px` }}>
          Adicione seu texto geral para compor o PDF.
        </p>,
      );
    } else {
      paragraphs.forEach((p, i) => {
        items.push(
          <p key={`p-${i}`} style={{ fontSize: `${bodySize}px` }}>
            {p}
          </p>,
        );
      });
    }

    return items;
  }, [title, subtitle, body, titleSize, subtitleSize, bodySize]);

  const [generated, setGenerated] = React.useState<PDFData | null>(null);

  const handleGenerate = () => {
    const data: PDFData = {
      cover: {
        background: DEFAULTS.coverBackground,
        logo: DEFAULTS.logo,
        lessonNumber: title || " ",
        topic: subtitle || " ",
        signatureTitle: signatureHeadline || undefined,
        signatureSubtitle: signatureSubline || undefined,
      },
      contentBackground: DEFAULTS.contentBackground,
      pageTopRightLogo: DEFAULTS.pageTopRightLogo,
      blocks,
    };
    setGenerated(data);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGenerateWithAI = async () => {
    if (loadingAI) return;
    setLoadingAI(true);
    const tId = showLoading("Gerando conteúdo com IA...");
    try {
      const res = await fetch(
        "https://nolrnrwzeurbimcnjlwm.supabase.co/functions/v1/gpt-pdf-helper",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbHJucnd6ZXVyYmltY25qbHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwODg3NjYsImV4cCI6MjA2NzY2NDc2Nn0.wwkTP3ca1a5emAiEZyZGxnujlOW7tAuJrExwRwzQ6XA",
          },
          body: JSON.stringify({
            title,
            subtitle,
            body,
            language: "pt-BR",
          }),
        },
      );

      const data = await res.json();
      if (!res.ok) {
        showError(data?.error || "Falha ao gerar com IA.");
        return;
      }

      const aiTitle: string = data?.title || title;
      const aiSubtitle: string = data?.subtitle || subtitle;
      const paragraphs: string[] = Array.isArray(data?.paragraphs)
        ? data.paragraphs
        : typeof data?.content === "string"
          ? data.content.split(/\n+/).filter(Boolean)
          : [];

      // Preenche os campos com as sugestões
      setTitle(aiTitle);
      setSubtitle(aiSubtitle);
      setBody(paragraphs.length ? paragraphs.join("\n\n") : body);

      // E monta o PDF com o conteúdo sugerido
      const nextBlocks = [
        aiTitle?.trim()
          ? (
            <h1 key="title" style={{ fontSize: `${titleSize}px` }}>
              {aiTitle}
            </h1>
          )
          : null,
        aiSubtitle?.trim()
          ? (
            <h2 key="subtitle" style={{ fontSize: `${subtitleSize}px` }}>
              {aiSubtitle}
            </h2>
          )
          : null,
        ...(paragraphs.length
          ? paragraphs.map((p, i) => (
              <p key={`ai-p-${i}`} style={{ fontSize: `${bodySize}px` }}>
                {p}
              </p>
            ))
          : []),
      ].filter(Boolean) as React.ReactNode[];

      const dataPDF: PDFData = {
        cover: {
          background: DEFAULTS.coverBackground,
          logo: DEFAULTS.logo,
          lessonNumber: aiTitle || " ",
          topic: aiSubtitle || " ",
          signatureTitle: signatureHeadline || undefined,
          signatureSubtitle: signatureSubline || undefined,
        },
        contentBackground: DEFAULTS.contentBackground,
        pageTopRightLogo: DEFAULTS.pageTopRightLogo,
        blocks: nextBlocks,
      };

      setGenerated(dataPDF);
      showSuccess("Conteúdo gerado com IA.");
    } catch (_e) {
      showError("Não foi possível gerar o conteúdo com IA agora.");
    } finally {
      dismissToast(tId);
      setLoadingAI(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white py-6">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Formulário */}
          <Card className="w-full lg:w-[420px] print:hidden">
            <CardHeader>
              <CardTitle>Montar PDF</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Título */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="title">Título (capa)</Label>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Tamanho</Label>
                    <Select
                      value={String(titleSize)}
                      onValueChange={(v) => setTitleSize(parseInt(v, 10))}
                    >
                      <SelectTrigger className="w-[110px]">
                        <SelectValue placeholder="Tamanho" />
                      </SelectTrigger>
                      <SelectContent>
                        {sizeOptionsTitle.map((s) => (
                          <SelectItem key={s} value={String(s)}>
                            {s}px
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Digite o título"
                />
              </div>

              {/* Subtítulo */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="subtitle">Subtítulo (capa)</Label>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Tamanho</Label>
                    <Select
                      value={String(subtitleSize)}
                      onValueChange={(v) => setSubtitleSize(parseInt(v, 10))}
                    >
                      <SelectTrigger className="w-[110px]">
                        <SelectValue placeholder="Tamanho" />
                      </SelectTrigger>
                      <SelectContent>
                        {sizeOptionsSubtitle.map((s) => (
                          <SelectItem key={s} value={String(s)}>
                            {s}px
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Input
                  id="subtitle"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Digite o subtítulo (opcional)"
                />
              </div>

              {/* Assinatura da capa */}
              <div className="space-y-2">
                <Label>Assinatura (capa)</Label>
                <Input
                  id="signatureHeadline"
                  value={signatureHeadline}
                  onChange={(e) => setSignatureHeadline(e.target.value)}
                  placeholder="Headline da assinatura (ex.: GÊNESIS, O INÍCIO DE TUDO.)"
                />
                <Input
                  id="signatureSubline"
                  value={signatureSubline}
                  onChange={(e) => setSignatureSubline(e.target.value)}
                  placeholder="Assinatura da headline (ex.: COM LUMA ELPÍDIO)"
                />
                <p className="text-xs text-muted-foreground">
                  Exibida no canto inferior direito da capa. A headline aparece maior.
                </p>
              </div>

              {/* Texto Geral */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="body">Texto geral</Label>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Tamanho</Label>
                    <Select
                      value={String(bodySize)}
                      onValueChange={(v) => setBodySize(parseInt(v, 10))}
                    >
                      <SelectTrigger className="w-[110px]">
                        <SelectValue placeholder="Tamanho" />
                      </SelectTrigger>
                      <SelectContent>
                        {sizeOptionsBody.map((s) => (
                          <SelectItem key={s} value={String(s)}>
                            {s}px
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Digite o texto geral do PDF..."
                  className="min-h-[220px] resize-vertical"
                />
                <p className="text-xs text-muted-foreground">
                  Dica: use uma linha em branco para separar parágrafos.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button variant="secondary" onClick={handleGenerateWithAI} disabled={loadingAI}>
                  {loadingAI ? "Gerando..." : "Gerar com IA"}
                </Button>
                <Button onClick={handleGenerate}>Gerar PDF</Button>
              </div>
            </CardContent>
          </Card>

          {/* Prévia */}
          <div className="flex-1">
            <div className="flex justify-end mb-3 gap-2 print:hidden">
              <Button variant="secondary" onClick={handlePrint} disabled={!generated}>
                Imprimir
              </Button>
            </div>
            <div className="print:block">
              {generated ? (
                <PDFGenerator data={generated} />
              ) : (
                <div className="w-full h-[420px] border rounded-md grid place-items-center text-center text-sm text-muted-foreground">
                  Preencha os campos e clique em “Gerar PDF” ou “Gerar com IA” para montar a capa e as páginas.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePDF;