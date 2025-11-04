import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { useTranslation } from "react-i18next";

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
<h1>Welcome to EbookFy</h1>
<p>Use this space to craft the content of your eBook. You can format headings, lists, and paragraphs as you prefer.</p>
<h2>Example section</h2>
<p>Try adding subheadings, lists, or quotes by using the floating toolbar of the editor.</p>
<blockquote>“Practice makes perfect.”</blockquote>
<ul>
  <li>Important point number one</li>
  <li>Important point number two</li>
</ul>
<p>When you are satisfied, use the preview on the right to see how your PDF will look before exporting.</p>
`;

const STORAGE_KEY = "ebookfy:create_pdf_state:v1";
const IMAGE_WIDTH_OPTIONS = [40, 50, 60, 70, 80, 90, 100];

const slugify = (value: string, fallback = "document") => {
  const base = (value || fallback)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base ? `${base}.pdf` : "document.pdf";
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
  const { t } = useTranslation("create-pdf");

  const [lessonNumber, setLessonNumber] = useState("M1 | Lesson 01");
  const [topic, setTopic] = useState("Lesson topic");
  const [title, setTitle] = useState("My amazing eBook");
  const [subtitle, setSubtitle] = useState("A journey in a few pages");
  const [signatureTitle, setSignatureTitle] = useState("EbookFy");
  const [signatureSubtitle, setSignatureSubtitle] = useState("eBooks in seconds");
  const [coverBackground, setCoverBackground] = useState(DEFAULTS.coverBackground);
  const [logo, setLogo] = useState(DEFAULTS.logo);
  const [contentBackground, setContentBackground] = useState(DEFAULTS.contentBackground);
  const [pageLogo, setPageLogo] = useState(DEFAULTS.pageLogo);
  const [language, setLanguage] = useState("en-US");
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
      console.error("Unable to load draft.", error);
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
      console.error("Unable to save draft.", error);
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
      const toastId = showLoading(t("messages.uploadingImage"));
      try {
        const publicUrl = await uploadImageToSupabase(file, { folder });
        setter(publicUrl);
        showSuccess(t("messages.imageUploaded"));
      } catch (error) {
        console.error(error);
        showError(t("messages.imageUploadError"));
      } finally {
        dismissToast(toastId);
        event.target.value = "";
      }
    },
    [t],
  );

  const handleInlineImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const toastId = showLoading(t("messages.uploadingImage"));
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
        showSuccess(t("messages.imageAdded"));
      } catch (error) {
        console.error(error);
        showError(t("messages.imageUploadError"));
      } finally {
        dismissToast(toastId);
        event.target.value = "";
      }
    },
    [selectedParagraph, t],
  );

  const handleRemoveImage = useCallback((id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  const handleApplyAI = useCallback(async () => {
    if (!aiEnabled) {
      showError(t("messages.aiPlanRequired"));
      return;
    }

    setIsGenerating(true);
    const toastId = showLoading(t("messages.aiGenerating"));
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
      if (!data) throw new Error("Empty AI response.");

      if (data.title) setTitle(data.title);
      if (data.subtitle) setSubtitle(data.subtitle);

      const paragraphs = (data.paragraphs ?? []).map((paragraph) => `<p>${sanitizeHtml(paragraph)}</p>`);
      if (paragraphs.length > 0) {
        setBodyHtml(paragraphs.join("\n"));
      }

      showSuccess(t("messages.aiSuccess"));
    } catch (err) {
      console.error(err);
      showError(t("messages.aiError"));
    } finally {
      dismissToast(toastId);
      setIsGenerating(false);
    }
  }, [aiEnabled, bodyHtml, language, suggestions, title, subtitle, t]);

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
    return [{ value: "0", label: t("cards.images.fields.beforeContent") }, ...options];
  }, [parsedContent.paragraphs, t]);

  const languageOptions = useMemo(
    () => [
      { value: "pt-BR", label: t("languageOptions.ptBr") },
      { value: "en-US", label: t("languageOptions.enUs") },
      { value: "es-ES", label: t("languageOptions.esEs") },
      { value: "fr-FR", label: t("languageOptions.frFr") },
    ],
    [t],
  );

  return (
    <div className="min-h-screen w-full bg-gray-50 py-6">
      <Seo
        title={t("seo.title")}
        description={t("seo.description")}
      />

      <div className="container mx-auto grid gap-6 px-4 lg:grid-cols-[420px_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("cards.cover.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t("cards.cover.fields.lessonNumber")}</Label>
                <Input value={lessonNumber} onChange={(e) => setLessonNumber(e.target.value)} />
              </div>
              <div>
                <Label>{t("cards.cover.fields.topic")}</Label>
                <Input value={topic} onChange={(e) => setTopic(e.target.value)} />
              </div>
              <div>
                <Label>{t("cards.cover.fields.title")}</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <Label>{t("cards.cover.fields.subtitle")}</Label>
                <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
              </div>
              <div>
                <Label>{t("cards.cover.fields.signatureTitle")}</Label>
                <Input value={signatureTitle} onChange={(e) => setSignatureTitle(e.target.value)} />
              </div>
              <div>
                <Label>{t("cards.cover.fields.signatureSubtitle")}</Label>
                <Input
                  value={signatureSubtitle}
                  onChange={(e) => setSignatureSubtitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("cards.cover.actions.uploadBackground")}</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => coverBackgroundInputRef.current?.click()}
                >
                  <UploadCloud className="mr-2 h-4 w-4" />
                  {t("buttons.uploadCoverBackground")}
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
                <Label>{t("cards.cover.actions.uploadLogo")}</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => logoInputRef.current?.click()}
                >
                  <UploadCloud className="mr-2 h-4 w-4" />
                  {t("buttons.uploadCoverLogo")}
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
              <CardTitle>{t("cards.content.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("cards.content.fields.pageLogo")}</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => pageLogoInputRef.current?.click()}
                >
                  <UploadCloud className="mr-2 h-4 w-4" />
                  {t("buttons.uploadContentLogo")}
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
                <Label>{t("cards.content.fields.background")}</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => contentBackgroundInputRef.current?.click()}
                >
                  <UploadCloud className="mr-2 h-4 w-4" />
                  {t("buttons.uploadContentBackground")}
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
                <Label>{t("cards.content.fields.language")}</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("cards.content.placeholders.language")} />
                  </SelectTrigger>
                  <SelectContent>
                    {languageOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <span>{t("switch.justify")}</span>
                <Switch checked={justifyText} onCheckedChange={setJustifyText} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>{t("cards.images.title")}</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="mr-2 h-4 w-4" />
                {t("buttons.addImage")}
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
                  <Label>{t("cards.images.fields.position")}</Label>
                  <Select value={selectedParagraph} onValueChange={setSelectedParagraph}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("cards.images.fields.position")} />
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
                  {t("cards.images.positionHelp")}
                </p>
              </div>

              <div className="space-y-3">
                {images.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    {t("cards.images.empty")}
                  </p>
                )}

                {images.map((image) => (
                  <div
                    key={image.id}
                    className="space-y-2 rounded-md border bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {t("cards.images.sectionTitle")}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveImage(image.id)}
                        aria-label="Remove image"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>{t("cards.images.fields.url")}</Label>
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
                      <Label>{t("cards.images.fields.caption")}</Label>
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
                        <Label>{t("cards.images.fields.width")}</Label>
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
                            <SelectValue placeholder="Width" />
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
                        <Label>{t("cards.images.fields.paragraph")}</Label>
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
              <CardTitle>{t("cards.assistant.title")}</CardTitle>
              <Sparkles className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {t("cards.assistant.description")}
              </p>
              <Textarea
                value={suggestions}
                onChange={(e) => setSuggestions(e.target.value)}
                placeholder={t("placeholders.aiSuggestions")}
                rows={4}
              />
              <Button onClick={handleApplyAI} disabled={isGenerating}>
                {isGenerating ? t("buttons.generating") : t("buttons.generateWithAI")}
              </Button>
              {!aiEnabled && (
                <p className="text-xs text-muted-foreground">
                  {t("alerts.aiUnavailable")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("cards.editor.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RichTextEditor
                value={bodyHtml}
                onChange={setBodyHtml}
                fontSizes={{ body: 20, h1: 40, h2: 28, h3: 24 }}
                className="bg-white"
                placeholder={t("placeholders.editor")}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>{t("cards.preview.title")}</CardTitle>
              <ExportPDFButton filename={filename} titleForHistory={title} />
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-sm">{t("cards.preview.description")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("cards.preview.help")}
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