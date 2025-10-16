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
import { supabase } from "@/integrations/supabase/client";

const sizeOptionsTitle = [40, 48, 56, 64, 72, 80];
const sizeOptionsSubtitle = [20, 22, 24, 28, 32, 36];
const sizeOptionsBody = [16, 18, 20, 22, 24, 26];

const DEFAULTS = {
  coverBackground:
    "https://nolrnrwzeurbimcnjlwm.supabase.co/storage/v1/object/public/Luma__Fran/Background.png",
  logo:
    "https://nolrnrwzeurbimcnҳәsupabase.co/storage/v1/object/public/Luma__Fran/Logo%20EDD.PNG".replace(
      "nolrnrwzeurbimcn غلام.supabase.co",
      "nolrnrwzeurbimcnjlwm.supabase.co"
    ),
  contentBackground:
    "https://nolrnrwzeurbimcnjlwm.supabase.co/storage/v1/object/public/Luma__Fran/fundo%20imagens%20luma.png",
  pageTopRightLogo:
    "https://nolrnrwzeurbimcnjlwm.supabase.co/storage/v1/object/public/Luma__Fran/Logo%20EDD.PNG",
};

export default function CreatePDF() {
  const [title, setTitle] = React.useState("Meu Título");
  const [subtitle, setSubtitle] = React.useState("Meu Subtítulo");
  const [signatureTitle, setSignatureTitle] = React.useState("");
  const [signatureSubtitle, setSignatureSubtitle] = React.useState("");
  const [body, setBody] = React.useState(
    "Cole seu texto aqui.\n\nSepare parágrafos com linha em branco."
  );
  const [titleSize, setTitleSize] = React.useState(64);
  const [subtitleSize, setSubtitleSize] = React.useState(28);
  const [bodySize, setBodySize] = React.useState(20);
  const [loadingAI, setLoadingAI] = React.useState(false);
  const [generated, setGenerated] = React.useState<PDFData | null>(null);

  const blocks = React.useMemo<React.ReactNode[]>(() => {
    const items: React.ReactNode[] = [];
    if (title.trim())
      items.push(
        <h1 key="title" style={{ fontSize: `${titleSize}px` }}>
          {title}
        </h1>
      );
    if (subtitle.trim())
      items.push(
        <h2 key="subtitle" style={{ fontSize: `${subtitleSize}px` }}>
          {subtitle}
        </h2>
      );
    const paras = body
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (paras.length === 0) {
      items.push(
        <p key="empty" style={{ fontSize: `${bodySize}px` }}>
          Adicione seu texto.
        </p>
      );
    } else {
      paras.forEach((p, i) =>
        items.push(
          <p key={`p-${i}`} style={{ fontSize: `${bodySize}px` }}>
            {p}
          </p>
        )
      );
    }
    return items;
  }, [title, subtitle, body, titleSize, subtitleSize, bodySize]);

  function buildPDFData(fromBlocks: React.ReactNode[]) {
    return {
      cover: {
        background: DEFAULTS.coverBackground,
        logo: DEFAULTS.logo,
        lessonNumber: title || " ",
        topic: subtitle || " ",
        signatureTitle: signatureTitle || undefined,
        signatureSubtitle: signatureSubtitle || undefined,
      },
      contentBackground: DEFAULTS.contentBackground,
      pageTopRightLogo: DEFAULTS.pageTopRightLogo,
      blocks: fromBlocks,
    } as PDFData;
  }

  const handleGenerate = () => {
    setGenerated(buildPDFData(blocks));
    showSuccess("PDF gerado!");
  };

  const handlePrint = () => {
    if (!generated) return;
    window.print();
  };

  const handleGenerateWithAI = async () => {
    if (loadingAI) return;
    setLoadingAI(true);
    const toastId = showLoading("Gerando com IA...");
    try {
      const { data, error } = await supabase.functions.invoke<{
        title: string;
        subtitle: string;
        paragraphs: string[];
      }>("gpt-pdf-helper", {
        body: JSON.stringify({ title, subtitle, body, language: "pt-BR" }),
      });
      if (error) throw error;
      const aiTitle = data.title || title;
      const aiSubtitle = data.subtitle || subtitle;
      const paras = Array.isArray(data.paragraphs) ? data.paragraphs : [];
      setTitle(aiTitle);
      setSubtitle(aiSubtitle);
      setBody(paras.join("\n\n"));
      const aiBlocks: React.ReactNode[] = [];
      if (aiTitle.trim())
        aiBlocks.push(
          <h1 key="ai-title" style={{ fontSize: `${titleSize}px` }}>
            {aiTitle}
          </h1>
        );
      if (aiSubtitle.trim())
        aiBlocks.push(
          <h2 key="ai-sub" style={{ fontSize: `${subtitleSize}px` }}>
            {aiSubtitle}
          </h2>
        );
      paras.forEach((p, i) =>
        aiBlocks.push(
          <p key={`ai-p-${i}`} style={{ fontSize: `${bodySize}px` }}>
            {p}
          </p>
        )
      );
      setGenerated(buildPDFData(aiBlocks));
      showSuccess("Conteúdo IA aplicado");
    } catch (err) {
      console.error(err);
      showError("Falha ao gerar com IA.");
    } finally {
      dismissToast(toastId);
      setLoadingAI(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Gerar PDF Personalizado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Título</Label>
              <div className="flex gap-2">
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <Select onValueChange={(v) => setTitleSize(Number(v))} defaultValue={`${titleSize}`}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sizeOptionsTitle.map((s) => (
                      <SelectItem key={s} value={`${s}`}>{`${s}px`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="subtitle">Subtítulo</Label>
              <div className="flex gap-2">
                <Input
                  id="subtitle"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                />
                <Select onValueChange={(v) => setSubtitleSize(Number(v))} defaultValue={`${subtitleSize}`}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sizeOptionsSubtitle.map((s) => (
                      <SelectItem key={s} value={`${s}`}>{`${s}px`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="signatureTitle">Título da Assinatura</Label>
              <Input
                id="signatureTitle"
                value={signatureTitle}
                onChange={(e) => setSignatureTitle(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="signatureSubtitle">Subtítulo da Assinatura</Label>
              <Input
                id="signatureSubtitle"
                value={signatureSubtitle}
                onChange={(e) => setSignatureSubtitle(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="body">Texto</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
              />
              <div className="mt-2 flex items-center gap-2">
                <span>Tamanho do corpo:</span>
                <Select onValueChange={(v) => setBodySize(Number(v))} defaultValue={`${bodySize}`}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sizeOptionsBody.map((s) => (
                      <SelectItem key={s} value={`${s}`}>{`${s}px`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleGenerate}>Gerar PDF</Button>
              <Button variant="secondary" onClick={handleGenerateWithAI} disabled={loadingAI}>
                Gerar com IA
              </Button>
              <Button variant="outline" onClick={handlePrint} disabled={!generated}>
                Imprimir
              </Button>
            </div>
          </CardContent>
        </Card>
        {generated && (
          <div className="mt-8">
            <PDFGenerator data={generated} />
          </div>
        )}
      </div>
    </div>
  );
}