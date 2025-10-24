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
import { Switch } from "@/components/ui/switch";
import { UploadCloud, Trash2, Sparkles } from "lucide-react";
import Seo from "@/components/Seo";
import PDFGenerator, { PDFData } from "@/components/PDFGenerator";
import ExportPDFButton from "@/components/ExportPDFButton";
import ImageBlock from "@/components/ImageBlock";
import {
  showError,
  showLoading,
  showSuccess,
  dismissToast,
} from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { uploadImageToSupabase } from "@/integrations/supabase/storage";
import { useEntitlements } from "@/features/subscription/useEntitlements";
import RichTextEditor from "@/components/RichTextEditor";
import { sanitizeHtml, convertTextToHtml } from "@/utils/rich-text";

type ImageItem = {
  src: string;
  caption?: string;
  width: number;
  afterParagraph: number;
};

type FlowBlock = {
  tag: string;
  html: string;
  text: string;
  paragraphIndex?: number;
};

const sizeOptionsTitle = [40, 48, 56, 64, 72, 80];
const sizeOptionsSubtitle = [20, 22, 24, 28, 32, 36];
const sizeOptionsBody = [16, 18, 20, 22, 24, 26];
const sizeOptionsH2 = [20, 22, 24, 26, 28, 32];
const sizeOptionsH3 = [16, 18, 20, 22, 24, 26];
const widthOptions = [40, 50, 60, 70, 80, 90, 100];

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

const DEFAULT_BODY_TEXT = [
  "Cole seu texto aqui.",
  "",
  "Separe parágrafos com uma linha em branco.",
  "",
  "## Exemplo de Seção",
  "",
  "### Exemplo de Sub-seção",
  "",
  "Texto do parágrafo após os subtítulos.",
].join("\n");

const DEFAULT_BODY_HTML = convertTextToHtml(DEFAULT_BODY_TEXT);

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function parseBodyContent(html: string): FlowBlock[] {
  const cleanHtml = sanitizeHtml(html || "");
  if (typeof window === "undefined") return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${cleanHtml}</div>`, "text/html");
  const blocks: FlowBlock[] = [];
  let paragraphIndex = 0;

  Array.from(doc.body.childNodes).forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    const tag = node.tagName.toLowerCase();
    const text = normalizeWhitespace(node.textContent || "");
    const inner = node.innerHTML;

    if (tag === "p") {
      paragraphIndex += 1;
      blocks.push({ tag, html: inner, text, paragraphIndex });
      return;
    }

    if (tag === "h1" || tag === "h2" || tag === "h3") {
      blocks.push({ tag, html: inner, text });
      return;
    }

    if (tag === "blockquote") {
      paragraphIndex += 1;
      blocks.push({ tag, html: inner, text, paragraphIndex });
      return;
    }

    if (tag === "ul" || tag === "ol") {
      paragraphIndex += 1;
      const listText = Array.from(node.querySelectorAll("li"))
        .map((li) => normalizeWhitespace(li.textContent || ""))
        .filter(Boolean)
        .join(" • ");
      blocks.push({
        tag,
        html: inner,
        text: listText || text,
        paragraphIndex,
      });
      return;
    }

    if (tag === "hr") {
      blocks.push({ tag, html: "", text: "" });
      return;
    }

    if (text.length > 0) {
      paragraphIndex += 1;
      blocks.push({ tag: "div", html: inner, text, paragraphIndex });
    }
  });

  return blocks;
}

function renderFlowBlock(
  block: FlowBlock,
  key: string,
  sizes: { t: number; s: number; b: number; h2: number; h3: number },
): React.ReactNode | null {
  const innerHtml = block.html?.trim() ?? "";

  switch (block.tag) {
    case "p":
      if (!innerHtml) return null;
      return (
        <p
          key={key}
          style={{ fontSize: sizes.b }}
          dangerouslySetInnerHTML={{ __html: innerHtml }}
        />
      );
    case "h1":
    case "h2":
      if (!innerHtml) return null;
      return (
        <h2
          key={key}
          style={{ fontSize: sizes.h2 }}
          dangerouslySetInnerHTML={{ __html: innerHtml }}
        />
      );
    case "h3":
      if (!innerHtml) return null;
      return (
        <h3
          key={key}
          style={{ fontSize: sizes.h3 }}
          dangerouslySetInnerHTML={{ __html: innerHtml }}
        />
      );
    case "blockquote":
      if (!innerHtml) return null;
      return (
        <blockquote
          key={key}
          className="border-l-4 border-gray-300 pl-4 italic my-4"
          style={{ fontSize: sizes.b }}
          dangerouslySetInnerHTML={{ __html: innerHtml }}
        />
      );
    case "ul":
    case "ol": {
      if (!innerHtml) return null;
      const ListTag = block.tag as "ul" | "ol";
      return React.createElement(ListTag, {
        key,
        style: { fontSize: sizes.b },
        dangerouslySetInnerHTML: { __html: innerHtml },
      });
    }
    case "hr":
      return <hr key={key} className="my-6 border-t border-muted-foreground/40" />;
    case "div":
    default:
      if (!innerHtml) return null;
      return (
        <div
          key={key}
          style={{ fontSize: sizes.b }}
          dangerouslySetInnerHTML={{ __html: innerHtml }}
        />
      );
  }
}

function composeContentBlocks(
  title: string,
  subtitle: string,
  contentBlocks: FlowBlock[],
  sizes: { t: number; s: number; b: number; h2: number; h3: number },
  images: ImageItem[],
): React.ReactNode[] {
  const items: React.ReactNode[] = [];
  const trimmedTitle = title.trim();
  const trimmedSubtitle = subtitle.trim();

  if (trimmedTitle) {
    items.push(
      <h1 key="title" style={{ fontSize: sizes.t }}>
        {trimmedTitle}
      </h1>,
    );
  }

  if (trimmedSubtitle) {
    items.push(
      <h2 key="subtitle" style={{ fontSize: sizes.s }}>
        {trimmedSubtitle}
      </h2>,
    );
  }

  const imagesByParagraph = new Map<number, ImageItem[]>();
  images.forEach((img) => {
    const bucket = imagesByParagraph.get(img.afterParagraph) ?? [];
    bucket.push(img);
    imagesByParagraph.set(img.afterParagraph, bucket);
  });

  const initialImages = imagesByParagraph.get(0) ?? [];
  initialImages.forEach((img, idx) => {
    items.push(
      <ImageBlock
        key={`img-start-${idx}-${img.src}`}
        src={img.src}
        caption={img.caption}
        widthPercent={img.width}
        align="center"
      />,
    );
  });
  imagesByParagraph.delete(0);

  contentBlocks.forEach((block, index) => {
    const element = renderFlowBlock(block, `block-${index}`, sizes);
    if (element) {
      items.push(element);
    }

    if (block.paragraphIndex) {
      const nextImages = imagesByParagraph.get(block.paragraphIndex) ?? [];
      nextImages.forEach((img, imgIdx) => {
        items.push(
          <ImageBlock
            key={`img-${block.paragraphIndex}-${imgIdx}-${img.src}`}
            src={img.src}
            caption={img.caption}
            widthPercent={img.width}
            align="center"
          />,
        );
      });
    }
  });

  const hasContent = contentBlocks.some((block) => {
    if (block.tag === "hr") return true;
    if (block.paragraphIndex) return true;
    return block.text.length > 0;
  });

  if (!hasContent && initialImages.length === 0) {
    items.push(
      <p key="empty" style={{ fontSize: sizes.b }}>
        Adicione seu texto.
      </p>,
    );
  }

  return items;
}

function buildParagraphSummaries(contentBlocks: FlowBlock[]): string[] {
  const paragraphs = contentBlocks.filter((block) => block.paragraphIndex);
  if (paragraphs.length === 0) return [];

  const maxIndex = paragraphs.reduce(
    (acc, block) => Math.max(acc, block.paragraphIndex ?? 0),
    0,
  );

  const map = new Map<number, string>();
  paragraphs.forEach((block) => {
    if (block.paragraphIndex) {
      map.set(block.paragraphIndex, block.text);
    }
  });

  const summaries: string[] = [];
  for (let i = 1; i <= maxIndex; i++) {
    const summary = (map.get(i) || "").trim();
    summaries.push(summary.length ? summary : `Parágrafo ${i}`);
  }
  return summaries;
}

function slugifyFilename(title: string, fallback: string): string {
  const base = (title || fallback || "documento")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base ? `${base}.pdf` : "documento.pdf";
}

export default function CreatePDF() {
  const [title, setTitle] = React.useState("Meu Título");
  const [subtitle, setSubtitle] = React.useState("Meu Subtítulo");
  const [lessonNumber, setLessonNumber] = React.useState("M1 | Aula 01");
  const [topic, setTopic] = React.useState("Tema da Aula");
  const [signatureTitle, setSignatureTitle] = React.useState("");
  const [signatureSubtitle, setSignatureSubtitle] = React.useState("");
  const [coverBackground, setCoverBackground] = React.useState(DEFAULTS.coverBackground);
  const [logo, setLogo] = React.useState(DEFAULTS.logo);
  const [contentBackground, setContentBackground] = React.useState(DEFAULTS.contentBackground);
  const [pageTopRightLogo, setPageTopRightLogo] = React.useState(DEFAULTS.pageTopRightLogo);
  const [language, setLanguage] = React.useState("pt-BR");

  const [body, setBody] = React.useState<string>(DEFAULT_BODY_HTML);
  const [suggestions, setSuggestions] = React.useState("");
  const [justifyText, setJustifyText] = React.useState(true);
  const [titleSize, setTitleSize] = React.useState(64);
  const [subtitleSize, setSubtitleSize] = React.useState(28);
  const [bodySize, setBodySize] = React.useState(20);
  const [h2Size, setH2Size] = React.useState(24);
  const [h3Size, setH3Size] = React.useState(20);

  const [images, setImages] = React.useState<ImageItem[]>([]);
  const [imgUrl, setImgUrl] = React.useState("");
  const [imgCaption, setImgCaption] = React.useState("");
  const [imgWidth, setImgWidth] = React.useState(80);
  const [imgAfterPara, setImgAfterPara] = React.useState(0);
  const [uploading, setUploading] = React.useState(false);
  const [loadingAI, setLoadingAI] = React.useState(false);

  const { aiEnabled } = useEntitlements();

  const contentBlocks = React.useMemo(() => parseBodyContent(body), [body]);
  const paragraphSummaries = React.useMemo(
    () => buildParagraphSummaries(contentBlocks),
    [contentBlocks],
  );

  const blocks = React.useMemo<React.ReactNode[]>(() => {
    return composeContentBlocks(
      title,
      subtitle,
      contentBlocks,
      { t: titleSize, s: subtitleSize, b: bodySize, h2: h2Size, h3: h3Size },
      images,
    );
  }, [title, subtitle, contentBlocks, titleSize, subtitleSize, bodySize, h2Size, h3Size, images]);

  const filename = React.useMemo(() => slugifyFilename(topic || title, "ebookfy"), [title, topic]);

  const pdfData = React.useMemo<PDFData>(
    () => ({
      cover: {
        background: coverBackground || DEFAULTS.coverBackground,
        logo: logo || DEFAULTS.logo,
        lessonNumber: lessonNumber.trim() || "M1 | Aula 01",
        topic: topic.trim() || "Tema da Aula",
        signatureTitle: signatureTitle.trim() || undefined,
        signatureSubtitle: signatureSubtitle.trim() || undefined,
      },
      blocks,
      contentBackground: contentBackground || undefined,
      pageTopRightLogo: pageTopRightLogo || undefined,
      justifyText,
      language,
    }),
    [
      blocks,
      contentBackground,
      coverBackground,
      justifyText,
      language,
      lessonNumber,
      logo,
      pageTopRightLogo,
      signatureSubtitle,
      signatureTitle,
      topic,
    ],
  );

  const handleAddImage = React.useCallback(() => {
    const trimmed = imgUrl.trim();
    if (!trimmed) {
      showError("Informe uma URL de imagem válida.");
      return;
    }
    setImages((prev) => [
      ...prev,
      {
        src: trimmed,
        caption: imgCaption.trim() || undefined,
        width: Math.min(100, Math.max(30, imgWidth)),
        afterParagraph: imgAfterPara,
      },
    ]);
    setImgUrl("");
    setImgCaption("");
    setImgWidth(80);
    setImgAfterPara(0);
    showSuccess("Imagem adicionada à composição.");
  }, [imgUrl, imgCaption, imgWidth, imgAfterPara]);

  const handleRemoveImage = React.useCallback((index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const handleUploadImage = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setUploading(true);
      const toastId = showLoading("Enviando imagem...");
      try {
        const url = await uploadImageToSupabase(file);
        setImgUrl(url);
        showSuccess("Upload concluído! Agora salve para inserir no PDF.");
      } catch (error) {
        console.error(error);
        showError("Não foi possível enviar a imagem.");
      } finally {
        dismissToast(toastId);
        setUploading(false);
        event.target.value = "";
      }
    },
    [],
  );

  const handleGenerateWithAI = React.useCallback(async () => {
    if (!aiEnabled) return;
    const sanitizedBody = sanitizeHtml(body);
    const plainBody = sanitizedBody.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    const toastId = showLoading("Gerando conteúdo com IA...");
    setLoadingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke<{
        title?: string;
        subtitle?: string;
        paragraphs?: string[];
      }>("gpt-pdf-helper", {
        body: {
          title: title.trim(),
          subtitle: subtitle.trim(),
          body: plainBody,
          language,
          suggestions: suggestions.trim() || undefined,
        },
      });

      if (error) {
        console.error(error);
        showError("A IA não respondeu. Tente novamente mais tarde.");
        return;
      }

      if (data?.title) {
        setTitle(data.title);
      }
      if (data?.subtitle) {
        setSubtitle(data.subtitle);
      }
      if (data?.paragraphs?.length) {
        const joined = data.paragraphs.join("\n\n");
        setBody(convertTextToHtml(joined));
      }

      showSuccess("Conteúdo atualizado com a IA!");
    } catch (err) {
      console.error(err);
      showError("Não foi possível gerar conteúdo com a IA.");
    } finally {
      dismissToast(toastId);
      setLoadingAI(false);
    }
  }, [aiEnabled, body, language, subtitle, suggestions, title]);

  return (
    <div className="min-h-screen w-full bg-gray-50 py-8">
      <Seo
        title="Criar PDF — EbookFy"
        description="Monte seu eBook com capa personalizada, conteúdo paginado e exporte em PDF."
      />
      <div className="container mx-auto px-4 space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Criar PDF</h1>
            <p className="text-sm text-muted-foreground">
              Ajuste título, capa, conteúdo e adicione imagens. Veja o preview e exporte em PDF.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setTitle("Meu Título");
                setSubtitle("Meu Subtítulo");
                setLessonNumber("M1 | Aula 01");
                setTopic("Tema da Aula");
                setSignatureTitle("");
                setSignatureSubtitle("");
                setCoverBackground(DEFAULTS.coverBackground);
                setLogo(DEFAULTS.logo);
                setContentBackground(DEFAULTS.contentBackground);
                setPageTopRightLogo(DEFAULTS.pageTopRightLogo);
                setBody(DEFAULT_BODY_HTML);
                setImages([]);
                setSuggestions("");
                setJustifyText(true);
                setTitleSize(64);
                setSubtitleSize(28);
                setBodySize(20);
                setH2Size(24);
                setH3Size(20);
                setLanguage("pt-BR");
                showSuccess("Campos redefinidos para o padrão.");
              }}
            >
              Resetar campos
            </Button>
            <ExportPDFButton filename={filename} titleForHistory={topic || title} />
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes da capa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="lessonNumber">Número / módulo</Label>
                  <Input
                    id="lessonNumber"
                    value={lessonNumber}
                    onChange={(event) => setLessonNumber(event.target.value)}
                    placeholder="Ex.: M3 | Aula 06"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="topic">Tema principal</Label>
                  <Input
                    id="topic"
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                    placeholder="Origem das Nações"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="signatureTitle">Assinatura (linha 1)</Label>
                  <Input
                    id="signatureTitle"
                    value={signatureTitle}
                    onChange={(event) => setSignatureTitle(event.target.value)}
                    placeholder="Gênesis, o início de tudo."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="signatureSubtitle">Assinatura (linha 2)</Label>
                  <Input
                    id="signatureSubtitle"
                    value={signatureSubtitle}
                    onChange={(event) => setSignatureSubtitle(event.target.value)}
                    placeholder="Com Luma Elpidio"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Imagens e logos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="coverBackground">Fundo da capa</Label>
                  <Input
                    id="coverBackground"
                    value={coverBackground}
                    onChange={(event) => setCoverBackground(event.target.value)}
                    placeholder="URL da imagem"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="logo">Logo da capa</Label>
                  <Input
                    id="logo"
                    value={logo}
                    onChange={(event) => setLogo(event.target.value)}
                    placeholder="URL do logo"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contentBackground">Fundo das páginas</Label>
                  <Input
                    id="contentBackground"
                    value={contentBackground}
                    onChange={(event) => setContentBackground(event.target.value)}
                    placeholder="URL opcional para o fundo"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pageTopRightLogo">Logo do canto superior</Label>
                  <Input
                    id="pageTopRightLogo"
                    value={pageTopRightLogo}
                    onChange={(event) => setPageTopRightLogo(event.target.value)}
                    placeholder="URL opcional para o logo das páginas"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configurações de texto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
                  <Label htmlFor="justifyText" className="text-sm">
                    Justificar parágrafos automaticamente
                  </Label>
                  <Switch
                    id="justifyText"
                    checked={justifyText}
                    onCheckedChange={setJustifyText}
                  />
                </div>

                <div className="grid gap-3">
                  <Label className="text-sm font-medium">Tamanho das fontes</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5">
                      <span className="text-xs text-muted-foreground">Título principal</span>
                      <Select
                        value={titleSize.toString()}
                        onValueChange={(value) => setTitleSize(Number(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {sizeOptionsTitle.map((size) => (
                            <SelectItem key={size} value={size.toString()}>
                              {size}px
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1.5">
                      <span className="text-xs text-muted-foreground">Subtítulo</span>
                      <Select
                        value={subtitleSize.toString()}
                        onValueChange={(value) => setSubtitleSize(Number(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {sizeOptionsSubtitle.map((size) => (
                            <SelectItem key={size} value={size.toString()}>
                              {size}px
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1.5">
                      <span className="text-xs text-muted-foreground">Parágrafos</span>
                      <Select
                        value={bodySize.toString()}
                        onValueChange={(value) => setBodySize(Number(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {sizeOptionsBody.map((size) => (
                            <SelectItem key={size} value={size.toString()}>
                              {size}px
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1.5">
                      <span className="text-xs text-muted-foreground">Títulos nível 2</span>
                      <Select
                        value={h2Size.toString()}
                        onValueChange={(value) => setH2Size(Number(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {sizeOptionsH2.map((size) => (
                            <SelectItem key={size} value={size.toString()}>
                              {size}px
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1.5">
                      <span className="text-xs text-muted-foreground">Títulos nível 3</span>
                      <Select
                        value={h3Size.toString()}
                        onValueChange={(value) => setH3Size(Number(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {sizeOptionsH3.map((size) => (
                            <SelectItem key={size} value={size.toString()}>
                              {size}px
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1.5">
                      <span className="text-xs text-muted-foreground">Idioma das páginas</span>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pt-BR">Português (pt-BR)</SelectItem>
                          <SelectItem value="en-US">Inglês (en-US)</SelectItem>
                          <SelectItem value="es-ES">Espanhol (es-ES)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Adicionar imagem ao conteúdo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="imgUrl">URL da imagem</Label>
                  <Input
                    id="imgUrl"
                    value={imgUrl}
                    onChange={(event) => setImgUrl(event.target.value)}
                    placeholder="https://exemplo.com/imagem.png"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Ou envie um arquivo</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadImage}
                      disabled={uploading}
                    />
                    <Button type="button" variant="outline" disabled>
                      <UploadCloud className="mr-2 h-4 w-4" />
                      Upload
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Após o upload, o campo de URL será preenchido automaticamente.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="imgCaption">Legenda (opcional)</Label>
                  <Input
                    id="imgCaption"
                    value={imgCaption}
                    onChange={(event) => setImgCaption(event.target.value)}
                    placeholder="Descrição da imagem"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Largura (em % da página)</Label>
                  <Select
                    value={imgWidth.toString()}
                    onValueChange={(value) => setImgWidth(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {widthOptions.map((width) => (
                        <SelectItem key={width} value={width.toString()}>
                          {width}%
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Inserir após</Label>
                  <Select
                    value={imgAfterPara.toString()}
                    onValueChange={(value) => setImgAfterPara(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Antes do conteúdo</SelectItem>
                      {paragraphSummaries.map((summary, index) => (
                        <SelectItem key={index + 1} value={(index + 1).toString()}>
                          {index + 1}. {summary.slice(0, 48)}{summary.length > 48 ? "…" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="button" onClick={handleAddImage} disabled={uploading}>
                  Adicionar imagem ao PDF
                </Button>

                {images.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Imagens adicionadas</h3>
                    <ul className="space-y-2 text-sm">
                      {images.map((img, index) => (
                        <li
                          key={`${img.src}-${index}`}
                          className="flex items-start justify-between rounded-md border bg-white px-3 py-2"
                        >
                          <div className="mr-3 flex-1">
                            <p className="font-medium">{img.caption || img.src}</p>
                            <p className="text-xs text-muted-foreground">
                              {img.width}% • {img.afterParagraph === 0 ? "Antes do texto" : `Após parágrafo ${img.afterParagraph}`}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveImage(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {aiEnabled && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Assistente com IA
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Gere ou reorganize o texto com o auxílio da IA. Use instruções para ajustar o tom.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-2">
                    <Label htmlFor="suggestions">Instruções adicionais (opcional)</Label>
                    <Textarea
                      id="suggestions"
                      value={suggestions}
                      onChange={(event) => setSuggestions(event.target.value)}
                      placeholder="Peça para reforçar pontos, mudar o tom ou adicionar uma conclusão."
                      rows={4}
                    />
                  </div>
                  <Button type="button" onClick={handleGenerateWithAI} disabled={loadingAI}>
                    {loadingAI ? "Gerando..." : "Melhorar conteúdo com IA"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    A IA reescreverá o título, subtítulo e corpo. Caso não haja resposta, o conteúdo atual permanece.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Conteúdo do eBook</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Título exibido na página</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Título do conteúdo"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="subtitle">Subtítulo exibido na página</Label>
                  <Input
                    id="subtitle"
                    value={subtitle}
                    onChange={(event) => setSubtitle(event.target.value)}
                    placeholder="Subtítulo do conteúdo"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Texto do conteúdo</Label>
                  <RichTextEditor value={body} onChange={setBody} />
                </div>
              </CardContent>
            </Card>

            <div className="rounded-lg border bg-white p-4">
              <h2 className="text-lg font-semibold">Preview (formato A4)</h2>
              <p className="text-sm text-muted-foreground mb-3">
                Role para visualizar todas as páginas. Ajustes no formulário refletem aqui em tempo real.
              </p>
              <div className="space-y-6 overflow-y-auto rounded-md border bg-muted/30 p-4 max-h-[75vh]">
                <PDFGenerator data={pdfData} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}