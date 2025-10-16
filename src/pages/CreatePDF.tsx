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
import supabase from "@/integrations/supabase/client";

const sizeOptionsTitle = [40, 48, 56, 64, 72, 80];
const sizeOptionsSubtitle = [20, 22, 24, 28, 32, 36];
const sizeOptionsBody = [16, 18, 20, 22, 24, 26];

const DEFAULTS = {
  coverBackground:
    "https://nolrnrwzeurbimcnjlwm.supabase.co/storage/v1/object/public/Luma__Fran/Background.png",
  logo:
    "https://nolrnrwzeurbimcnjlwm.supabase.co/storage/v1/object/public/Luma__Fran/Logo%20EDD.PNG",
  contentBackground:
    "https://nolrnrwzeurbimcn reordered.supabase.co/storage/v1/object/public/Luma__Fran/fundo%20imagens%20luma.png",
  pageTopRightLogo:
    "https://nolrnrwzeurbimcn reordered.supabase.co/storage/v1/object/public/Luma__Fran/Logo%20EDD.PNG"
      .replace(" reordered.supabase.co", "wzeurbimcnjlwm.supabase.co"),
};

const CreatePDF: React.FC = () => {
  const [title, setTitle] = React.useState<string>("Meu Título");
  const [subtitle, setSubtitle] = React.useState<string>("Meu Subtítulo opcional");
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
  const [generated, setGenerated] = React.useState<PDFData | null>(null);

  const blocks = React.useMemo<React.ReactNode[]>(() => {
    const items: React.ReactNode[] = [];
    if (title.trim()) items.push(<h1 key="title" style={{ fontSize: `${titleSize}px` }}>{title}</h1>);
    if (subtitle.trim()) items.push(<h2 key="subtitle" style={{ fontSize: `${subtitleSize}px` }}>{subtitle}</h2>);
    const paragraphs = body.split(/\n\s*\n/g).map(p => p.trim()).filter(Boolean);
    if (paragraphs.length === 0) {
      items.push(<p key="placeholder" style={{ fontSize: `${bodySize}px` }}>Adicione seu texto geral para compor o PDF.</p>);
    } else {
      paragraphs.forEach((p, i) => items.push(<p key={`p-${i}`} style={{ fontSize: `${bodySize}px` }}>{p}</p>));
    }
    return items;
  }, [title, subtitle, body, titleSize, subtitleSize, bodySize]);

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

  const handlePrint = () => window.print();

  const handleGenerateWithAI = async () => {
    if (loadingAI) return;
    setLoadingAI(true);
    const tId = showLoading("Gerando conteúdo com IA...");
    try {
      const { data, error } = await supabase.functions.invoke<{
        title: string;
        subtitle: string;
        paragraphs: string[];
      }>("gpt-pdf-helper", {
        body: JSON.stringify({ title, subtitle, body, language: "pt-BR" }),
      });

      if (error) {
        throw error;
      }
      const aiTitle = data.title || title;
      const aiSubtitle = data.subtitle || subtitle;
      const paragraphs = Array.isArray(data.paragraphs) ? data.paragraphs : [];
      setTitle(aiTitle);
      setSubtitle(aiSubtitle);
      setBody(paragraphs.join("\n\n") || body);

      const nextBlocks: React.ReactNode[] = [];
      if (aiTitle.trim()) nextBlocks.push(<h1 key="title" style={{ fontSize: `${titleSize}px` }}>{aiTitle}</h1>);
      if (aiSubtitle.trim()) nextBlocks.push(<h2 key="subtitle" style={{ fontSize: `${subtitleSize}px` }}>{aiSubtitle}</h2>);
      paragraphs.forEach((p, i) => nextBlocks.push(<p key={`ai-p-${i}`} style={{ fontSize: `${bodySize}px` }}>{p}</p>));

      setGenerated({
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
      });

      showSuccess("Conteúdo gerado com IA.");
    } catch (e) {
      console.error(e);
      showError("Não foi possível gerar o conteúdo com IA agora.");
    } finally {
      dismissToast(tId);
      setLoadingAI(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white py-6">
      {/* ... restante do JSX sem mudanças */}
    </div>
  );
};

export default CreatePDF;