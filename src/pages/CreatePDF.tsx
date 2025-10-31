import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UploadCloud, Trash2, Sparkles } from "lucide-react";
import Seo from "@/components/Seo";
import RichTextEditor from "@/components/RichTextEditor";
import PDFGenerator, { PDFData } from "@/components/PDFGenerator";
import ExportPDFButton from "@/components/ExportPDFButton";
import ImageBlock from "@/components/ImageBlock";
import { showError, showLoading, showSuccess, dismissToast } from "@/utils/toast";
import { uploadImageToSupabase } from "@/integrations/supabase/storage";
import { supabase } from "@/integrations/supabase/client";
import { useEntitlements } from "@/features/subscription/useEntitlements";
import { sanitizeHtml, convertHtmlToText } from "@/utils/rich-text";
import type { ImageItem, ParagraphOption } from "@/components/create-pdf/types";

type ParsedContent = {
  blocks: React.ReactNode[];
  paragraphs: string[];
};

const DEFAULTS = {
  coverBackground:
    "https://nolrnrwzeurbimcnjlwm.supabase.co/storage/v1/object/public/Luma__Fran/Background.png",
  logo: "",
  contentBackground:
    "https://nolrnrwzeurbimcnjlwm.supabase.co/storage/v1/object/public/Luma__Fran/fundo%20imagens%20luma.png",
  pageLogo: "",
};

const DEFAULT_BODY = `
<h1>Bem-vindo ao EbookFy</h1>
<p>Use este espaço para construir o conteúdo do seu eBook. Você pode formatar títulos, listas e parágrafos conforme preferir.</p>
<h2>Exemplo de seção</h2>
<p>Experimente inserir subtítulos, listas ou citações utilizando a barra de ferramentas flutuante do editor.</p>
<blockquote>“A prática leva à perfeição.”</blockquote>
<ul>
  <li>Ponto importante número um</li>
  <li>Ponto importante número dois</li>
</ul>
<p>Quando estiver satisfeito, utilize a pré-visualização ao lado para ver como o seu PDF ficará antes de exportar.</p>
`;

const STORAGE_KEY = "ebookfy:create_pdf_state:v1";
const IMAGE_WIDTH_OPTIONS = [40, 50, 60, 70, 80, 90, 100];
const LANGUAGE_OPTIONS = [
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "en-US", label: "English (US)" },
  { value: "es-ES", label: "Español (ES)" },
  { value: "fr-FR", label: "Français (FR)" },
];

const slugify = (value: string, fallback = "documento") => {
  const base = (value || fallback)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base ? `${base}.pdf` : "documento.pdf";
};

const createParagraphNode = (
  key: string,
  content: string,
  justify: boolean,
): React.ReactNode => (
  <p
    key={key}
    className={`mb-4 leading-relaxed ${justify ? "text-justify" : ""}`}
    dangerouslySetInnerHTML={{ __html: content }}
  />
);

const parseBodyHtml = (html: string, justify: boolean): ParsedContent => {
  const safe = sanitizeHtml(html || "");
  if (typeof window === "undefined") return { blocks: [], paragraphs: [] };

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${safe}</div>`, "text/html");
  const blocks: React.ReactNode[] = [];
  const paragraphs: string[] = [];
  let blockIndex = 0;

  const addParagraph = (text: string, htmlContent?: string) => {
    const trimmedText = text.trim();
    const trimmedHtml = (htmlContent ?? text).trim();
    if (!trimmedText && !trimmedHtml) return;
    const key = `block-${blockIndex++}`;
    blocks.push(createParagraphNode(key, trimmedHtml, justify));
    if (trimmedText) paragraphs.push(trimmedText);
  };

  const addHeading = (element: HTMLElement, level: 1 | 2 | 3) => {
    const text = element.textContent?.trim() ?? "";
    if (!text) return;
    const key = `block-${blockIndex++}`;
    const className =
      level === 1
        ? "text-4xl font-bold mb-4"
        : level === 2
          ? "text-3xl font-semibold mt-6 mb-3"
          : "text-2xl font-semibold mt-5 mb-3";
    blocks.push(
      React.createElement(`h${level}`, {
        key,
        className,
        dangerouslySetInnerHTML: { __html: element.innerHTML },
      }),
    );
  };

  const addBlockquote = (element: HTMLElement) => {
    const text = element.textContent?.trim() ?? "";
    if (!text) return;
    const key = `block-${blockIndex++}`;
    blocks.push(
      <blockquote
        key={key}
        className="border-l-4 border-muted-foreground/40 pl-4 italic my-4"
        dangerouslySetInnerHTML={{ __html: element.innerHTML }}
      />,
    );
    paragraphs.push(text);
  };

  const addList = (element: HTMLElement, ordered: boolean) => {
    const text = element.textContent?.trim() ?? "";
    if (!text) return;
    const key = `block-${blockIndex++}`;
    const Tag = ordered ? "ol" : "ul";
    blocks.push(
      React.createElement(Tag, {
        key,
        className: ordered
          ? "list-decimal pl-6 space-y-1 my-4"
          : "list-disc pl-6 space-y-1 my-4",
        dangerouslySetInnerHTML: { __html: element.innerHTML },
      }),
    );
    paragraphs.push(text);
  };

  const addDivider = () => {
    const key = `block-${blockIndex++}`;
    blocks.push(<hr key={key} className="my-6 border-muted-foreground/50" />);
  };

  const processNode = (node: ChildNode) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const value = node.textContent ?? "";
      value
        .replace(/\r\n/g, "\n")
        .split(/\n{2,}/)
        .map((segment) => segment.trim())
        .filter(Boolean)
        .forEach((segment) => addParagraph(segment));
      return;
    }

    if (!(node instanceof HTMLElement)) return;

    const tag = node.tagName.toLowerCase();
    switch (tag) {
      case "h1":
        addHeading(node, 1);
        break;
      case "h2":
        addHeading(node, 2);
        break;
      case "h3":
        addHeading(node, 3);
        break;
      case "p":
        addParagraph(node.textContent ?? "", node.innerHTML);
        break;
      case "blockquote":
        addBlockquote(node);
        break;
      case "ul":
        addList(node, false);
        break;
      case "ol":
        addList(node, true);
        break;
      case "hr":
        addDivider();
        break;
      case "br":
        break;
      default:
        if (node.childNodes.length > 0) {
          Array.from(node.childNodes).forEach(processNode);
        } else {
          addParagraph(node.textContent ?? "");
        }
        break;
    }
  };

  Array.from(doc.body.childNodes).forEach(processNode);

  if (blocks.length === 0) {
    const fallback = (doc.body.textContent || safe || "")
      .replace(/\r\n/g, "\n")
      .split(/\n{2,}/)
      .map((segment) => segment.trim())
      .filter(Boolean);

    fallback.forEach((segment) => addParagraph(segment));
  }

  return { blocks, paragraphs };
};

const CreatePDF: React.FC = () => {
  const { aiEnabled } = useEntitlements();

  const [lessonNumber, setLessonNumber] = useState("M1 | Aula 01");
  const [topic, setTopic] = useState("Tema da Aula");
  const [title, setTitle] = useState("Meu eBook incrível");
  const [subtitle, setSubtitle] = useState("Uma jornada em poucas páginas");
  const [signatureTitle, setSignatureTitle] = useState("EbookFy");
  const [signatureSubtitle, setSignatureSubtitle] = useState("Ebook em segundos");
  const [coverBackground, setCoverBackground] = useState(DEFAULTS.coverBackground);
  const [logo, setLogo] = useState(DEFAULTS.logo);
  const [contentBackground, setContentBackground] = useState(DEFAULTS.contentBackground);
  const [pageLogo, setPageLogo] = useState(DEFAULTS.pageLogo);
  const [language, setLanguage] = useState("pt-BR");
  const [justifyText, setJustifyText] = useState(true);

  const [bodyHtml, setBodyHtml] = useState<string>(DEFAULT_BODY);
  const [suggestions, setSuggestions] = useState("");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [selectedParagraph, setSelectedParagraph] = useState("0");

  const [isGenerating, setIsGenerating] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const coverBackgroundInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const pageLogoInputRef = useRef<HTMLInputElement | null>(null);
  const contentBackgroundInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setDraftLoaded(true);
        return;
      }
      const saved = JSON.parse(raw) as Partial<{
        lessonNumber: string;
        topic: string;
        title: string;
        subtitle: string;
        signatureTitle: string;
        signatureSubtitle: string;
        coverBackground: string;
        logo: string;
        contentBackground: string;
        pageLogo: string;
        language: string;
        justifyText: boolean;
        bodyHtml: string;
        suggestions: string;
        images: ImageItem[];
        selectedParagraph: string;
      }>;

      if (saved.lessonNumber) setLessonNumber(saved.lessonNumber);
      if (saved.topic) setTopic(saved.topic);
      if (saved.title) setTitle(saved.title);
      if (saved.subtitle) setSubtitle(saved.subtitle);
      if (saved.signatureTitle) setSignatureTitle(saved.signatureTitle);
      if (saved.signatureSubtitle) setSignatureSubtitle(saved.signatureSubtitle);
      if (saved.coverBackground) setCoverBackground(saved.coverBackground);
      if (typeof saved.logo === "string") setLogo(saved.logo);
      if (saved.contentBackground) setContentBackground(saved.contentBackground);
      if (typeof saved.pageLogo === "string") setPageLogo(saved.pageLogo);
      if (saved.language) setLanguage(saved.language);
      if (typeof saved.justifyText === "boolean") setJustifyText(saved.justifyText);
      if (typeof saved.bodyHtml === "string") setBodyHtml(saved.bodyHtml);
      if (typeof saved.suggestions === "string") setSuggestions(saved.suggestions);
      if (typeof saved.selectedParagraph === "string") setSelectedParagraph(saved.selectedParagraph);

      if (Array.isArray(saved.images)) {
        setImages(
          saved.images.map((img) => ({
            id: img.id || crypto.randomUUID(),
            src: img.src || "",
            caption: img.caption ?? "",
            widthPercent: typeof img.widthPercent === "number" ? img.widthPercent : 80,
            afterParagraph: typeof img.afterParagraph === "number" ? img.afterParagraph : 0,
          })),
        );
      }
    } catch (error) {
      console.error("Não foi possível carregar o rascunho salvo.", error);
    } finally {
      setDraftLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!draftLoaded || typeof window === "undefined") return;
    const payload = {
      lessonNumber,
      topic,
      title,
      subtitle,
      signatureTitle,
      signatureSubtitle,
      coverBackground,
      logo,
      contentBackground,
      pageLogo,
      language,
      justifyText,
      bodyHtml,
      suggestions,
      images,
      selectedParagraph,
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.error("Não foi possível salvar o rascunho do eBook.", error);
    }
  }, [
    draftLoaded,
    lessonNumber,
    topic,
    title,
    subtitle,
    signatureTitle,
    signatureSubtitle,
    coverBackground,
    logo,
    contentBackground,
    pageLogo,
    language,
    justifyText,
    bodyHtml,
    suggestions,
    images,
    selectedParagraph,
  ]);

  const handleAssetUpload = useCallback(
    async (
      event: React.ChangeEvent<HTMLInputElement>,
      setter: React.Dispatch<React.SetStateAction<string>>,
      folder: string,
    ) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const toastId = showLoading("Enviando imagem...");
      try {
        const publicUrl = await uploadImageToSupabase(file, { folder });
        setter(publicUrl);
        showSuccess("Imagem atualizada com sucesso!");
      } catch (error) {
        console.error(error);
        showError("Não foi possível enviar a imagem.");
      } finally {
        dismissToast(toastId);
        event.target.value = "";
      }
    },
    [],
  );

  const handleInlineImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const toastId = showLoading("Carregando imagem...");
      try {
        const publicUrl = await uploadImageToSupabase(file);
        setImages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            src: publicUrl,
            caption: "",
            widthPercent: 80,
            afterParagraph: Number(selectedParagraph) || 0,
          },
        ]);
        showSuccess("Imagem adicionada com sucesso!");
      } catch (error) {
        console.error(error);
        showError("Não foi possível enviar a imagem.");
      } finally {
        dismissToast(toastId);
        event.target.value = "";
      }
    },
    [selectedParagraph],
  );

  const handleRemoveImage = useCallback((id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  const handleApplyAI = useCallback(async () => {
    if (!aiEnabled) {
      showError("O plano atual não inclui geração por IA.");
      return;
    }

    setIsGenerating(true);
    const toastId = showLoading("Gerando conteúdo com IA...");
    try {
      const { data, error } = await supabase.functions.invoke<{
        title?: string;
        subtitle?: string;
        paragraphs?: string[];
      }>("gpt-pdf-helper", {
        body: {
          title,
          subtitle,
          body: convertHtmlToText(bodyHtml),
          language,
          suggestions,
        },
      });

      if (error) throw error;
      if (!data) throw new Error("A resposta da IA está vazia.");

      if (data.title) setTitle(data.title);
      if (data.subtitle) setSubtitle(data.subtitle);

      const paragraphs = (data.paragraphs ?? []).map((paragraph) => `<p>${sanitizeHtml(paragraph)}</p>`);
      if (paragraphs.length > 0) {
        setBodyHtml(paragraphs.join("\n"));
      }

      showSuccess("Conteúdo atualizado com ajuda da IA.");
    } catch (err) {
      console.error(err);
      showError("Não foi possível gerar conteúdo com a IA.");
    } finally {
      dismissToast(toastId);
      setIsGenerating(false);
    }
  }, [aiEnabled, bodyHtml, language, subtitle, suggestions, title]);

  const parsedContent = useMemo(
    () => parseBodyHtml(bodyHtml, justifyText),
    [bodyHtml, justifyText],
  );

  const imageBlocks = useMemo(() => {
    if (images.length === 0) return parsedContent.blocks;

    const itemsByParagraph = new Map<number, ImageItem[]>();
    images.forEach((image) => {
      const key = image.afterParagraph;
      const existing = itemsByParagraph.get(key) ?? [];
      existing.push(image);
      itemsByParagraph.set(key, existing);
    });

    const result: React.ReactNode[] = [];
    parsedContent.blocks.forEach((block, idx) => {
      result.push(block);
      const paragraphNumber = idx + 1;
      const items = itemsByParagraph.get(paragraphNumber);
      if (items) {
        items.forEach((img) => {
          result.push(
            <ImageBlock
              key={`img-${img.id}`}
              src={img.src}
              caption={img.caption}
              widthPercent={img.widthPercent}
              align="center"
            />,
          );
        });
      }
    });

    const initialImages = itemsByParagraph.get(0);
    if (initialImages) {
      return [
        ...initialImages.map((img) => (
          <ImageBlock
            key={`img-${img.id}`}
            src={img.src}
            caption={img.caption}
            widthPercent={img.widthPercent}
            align="center"
          />
        )),
        ...result,
      ];
    }

    return result;
  }, [images, parsedContent.blocks]);

  const pdfData: PDFData = useMemo(
    () => ({
      cover: {
        background: coverBackground,
        logo,
        lessonNumber,
        topic,
        signatureTitle,
        signatureSubtitle,
      },
      blocks: imageBlocks,
      contentBackground,
      pageTopRightLogo: pageLogo,
      justifyText,
      language,
    }),
    [
      contentBackground,
      coverBackground,
      imageBlocks,
      justifyText,
      language,
      lessonNumber,
      logo,
      pageLogo,
      signatureSubtitle,
      signatureTitle,
      topic,
    ],
  );

  const filename = useMemo(() => slugify(title, "ebookfy"), [title]);

  const paragraphOptions: ParagraphOption[] = useMemo(() => {
    const options = parsedContent.paragraphs.map((paragraph, idx) => ({
      value: String(idx + 1),
      label: `${idx + 1} - ${paragraph.slice(0, 60)}${paragraph.length > 60 ? "..." : ""}`,
    }));
    return [{ value: "0", label: "Inserir antes do conteúdo" }, ...options];
  }, [parsedContent.paragraphs]);

  return (
    <div className="min-h-screen w-full bg-gray-50 py-6">
      <Seo
        title="Criar PDF — EbookFy"
        description="Monte seu PDF com capa, conteúdo e exportação em segundos."
      />

      <div className="container mx-auto grid gap-6 px-4 lg:grid-cols-[420px_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Capa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Número da aula</Label>
                <Input value={lessonNumber} onChange={(e) => setLessonNumber(e.target.value)} />
              </div>
              <div>
                <Label>Tema</Label>
                <Input value={topic} onChange={(e) => setTopic(e.target.value)} />
              </div>
              <div>
                <Label>Título principal</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <Label>Subtítulo</Label>
                <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
              </div>
              <div>
                <Label>Linha de assinatura</Label>
                <Input value={signatureTitle} onChange={(e) => setSignatureTitle(e.target.value)} />
              </div>
              <div>
                <Label>Subtítulo da assinatura</Label>
                <Input
                  value={signatureSubtitle}
                  onChange={(e) => setSignatureSubtitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Imagem de fundo (capa)</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => coverBackgroundInputRef.current?.click()}
                >
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Upload imagem de fundo
                </Button>
                <input
                  ref={coverBackgroundInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) =>
                    handleAssetUpload(event, setCoverBackground, "cover-backgrounds")
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Logo da capa</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => logoInputRef.current?.click()}
                >
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Upload logo da capa
                </Button>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => handleAssetUpload(event, setLogo, "logos")}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurações do conteúdo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Logo no conteúdo</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => pageLogoInputRef.current?.click()}
                >
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Upload logo do conteúdo
                </Button>
                <input
                  ref={pageLogoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => handleAssetUpload(event, setPageLogo, "page-logos")}
                />
              </div>
              <div className="space-y-2">
                <Label>Background das páginas</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => contentBackgroundInputRef.current?.click()}
                >
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Upload background
                </Button>
                <input
                  ref={contentBackgroundInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) =>
                    handleAssetUpload(event, setContentBackground, "content-backgrounds")
                  }
                />
              </div>
              <div>
                <Label>Idioma</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <span>Justificar parágrafos</span>
                <Switch checked={justifyText} onCheckedChange={setJustifyText} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Imagens</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="mr-2 h-4 w-4" />
                Adicionar imagem
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleInlineImageUpload}
              />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Posição</Label>
                  <Select value={selectedParagraph} onValueChange={setSelectedParagraph}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a posição" />
                    </SelectTrigger>
                    <SelectContent>
                      {paragraphOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  Escolha o parágrafo após o qual as novas imagens serão inseridas.
                </p>
              </div>

              <div className="space-y-3">
                {images.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma imagem adicionada ainda.
                  </p>
                )}

                {images.map((image) => (
                  <div
                    key={image.id}
                    className="space-y-2 rounded-md border bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Imagem</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveImage(image.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>URL</Label>
                      <Input
                        value={image.src}
                        onChange={(e) =>
                          setImages((prev) =>
                            prev.map((item) =>
                              item.id === image.id ? { ...item, src: e.target.value } : item,
                            ),
                          )
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Legenda</Label>
                      <Input
                        value={image.caption ?? ""}
                        onChange={(e) =>
                          setImages((prev) =>
                            prev.map((item) =>
                              item.id === image.id ? { ...item, caption: e.target.value } : item,
                            ),
                          )
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Tamanho</Label>
                        <Select
                          value={String(image.widthPercent)}
                          onValueChange={(value) =>
                            setImages((prev) =>
                              prev.map((item) =>
                                item.id === image.id
                                  ? { ...item, widthPercent: Number(value) }
                                  : item,
                              ),
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Largura" />
                          </SelectTrigger>
                          <SelectContent>
                            {IMAGE_WIDTH_OPTIONS.map((option) => (
                              <SelectItem key={option} value={String(option)}>
                                {option}%
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Parágrafo</Label>
                        <Select
                          value={String(image.afterParagraph)}
                          onValueChange={(value) =>
                            setImages((prev) =>
                              prev.map((item) =>
                                item.id === image.id
                                  ? { ...item, afterParagraph: Number(value) }
                                  : item,
                              ),
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {paragraphOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Assistente de IA</CardTitle>
              <Sparkles className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Escreva instruções adicionais para orientar a IA. O conteúdo existente será
                tratado como base.
              </p>
              <Textarea
                value={suggestions}
                onChange={(e) => setSuggestions(e.target.value)}
                placeholder="Ex.: Ajuste o tom para algo inspirador e inclua um convite à ação no final."
                rows={4}
              />
              <Button onClick={handleApplyAI} disabled={isGenerating || !aiEnabled}>
                {isGenerating ? "Gerando..." : "Gerar conteúdo com IA"}
              </Button>
              {!aiEnabled && (
                <p className="text-xs text-muted-foreground">
                  A geração por IA está disponível nos planos Basic e Pro.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conteúdo do eBook</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RichTextEditor
                value={bodyHtml}
                onChange={setBodyHtml}
                fontSizes={{ body: 20, h1: 40, h2: 28, h3: 24 }}
                className="bg-white"
                placeholder="Escreva ou cole o conteúdo do seu eBook aqui..."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Pré-visualização</CardTitle>
              <ExportPDFButton filename={filename} titleForHistory={title} />
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-sm">
                    O conteúdo é dividido automaticamente em páginas A4.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ajuste o texto e clique em exportar para gerar o PDF final.
                  </p>
                </div>
                <PDFGenerator data={pdfData} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreatePDF;