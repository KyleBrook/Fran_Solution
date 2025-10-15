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
    "https://nolrnrwzeurbimcnjlwm.supabase.co/storage/v1/object/public/Luma__Fran/Logo%20EDD.PNG",
};

const CreatePDF: React.FC = () => {
  const [title, setTitle] = React.useState<string>("Meu Título");
  const [subtitle, setSubtitle] = React.useState<string>("Meu Subtítulo opcional");
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
                  <Label htmlFor="title">Título</Label>
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
                  <Label htmlFor="subtitle">Subtítulo</Label>
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
                  Preencha os campos ao lado e clique em “Gerar PDF” para montar a capa e as páginas.
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