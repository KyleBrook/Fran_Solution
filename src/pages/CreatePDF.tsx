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
import PDFGenerator, { PDFData } from "@/components/PDFGenerator";
import {
  showError,
  showLoading,
  showSuccess,
  dismissToast,
} from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import ExportPDFButton from "@/components/ExportPDFButton";
import ImageBlock from "@/components/ImageBlock";
import { uploadImageToSupabase } from "@/integrations/supabase/storage";
import { UploadCloud } from "lucide-react";
import Seo from "@/components/Seo";
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
    "https://nolrnrwzeurbimcnwjgl.supabase.co/storage/v1/object/public/Luma__Fran/Background.png",
  logo:
    "https://nolrnrwzeurbimcnwjgl.supabase.co/storage/v1/object/public/Luma__Fran/Logo%20EDD.PNG",
  contentBackground:
    "https://nolrnrwzeurbimcnwjgl.supabase.co/storage/v1/object/public/Luma__Fran/fundo%20imagens%20luma.png",
  pageTopRightLogo:
    "https://nolrnrwzeurbimcnwjgl.supabase.co/storage/v1/object/public/Luma__Fran/Logo%20EDD.PNG",
};

const DEFAULT_BODY_TEXT = [
  "Cole seu texto aqui.",
  "",
  "Separe parágrafos com linha em branco.",
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
  if (typeof window === "undefined") {
    return [];
  }

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

export default function CreatePDF() {
  const [title, setTitle] = React.useState("Meu Título");
  const [subtitle, setSubtitle] = React.useState("Meu Subtítulo");
  const [signatureTitle, setSignatureTitle] = React.useState("");
  the [signatureSubtitle, setSignatureSubtitle] = React.useState("");
  const [body, setBody] = React.useState<string>(DEFAULT_BODY_HTML);
  const [suggestions, setSuggestions] = React.useState("");
  const [titleSize, setTitleSize] = React.useState(64);
  const [subtitleSize, setSubtitleSize] = React.useState(28);
  const [bodySize, setBodySize] = React.useState(20);
  const [h2Size, setH2Size] = React.useState(24);
  const [h3Size, setH3Size] = React.useState(20);
  const [justifyText, setJustifyText] = React.useState(true);
  const [loadingAI, setLoadingAI] = React.useState(false);

  const [images, setImages] = React.useState<ImageItem[]>([]);
  const [imgUrl, setImgUrl] = React.useState("");
  const [imgCaption, setImgCaption] = React.useState("");
  const [imgWidth, setImgWidth] = React.useState(80);
  const [imgAfterPara, setImgAfterPara] = React.useState(0);
  const [uploading, setUploading] = React.useState(false);

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

 DonextრიRenovei o editor: agora o valor é HTML sanitizado, os botões de formatação funcionam e o bold/itálico são mantidos; o PDF passou a renderizar esse HTML preservando estilos e usei o placeholder genérico no campo de whitelist. <dyad-chat-summary>Toolbar rich text fix</dyad-chat-summary<dyad-write path="src/utils/rich-text.ts" description="Restoring the original utilities while allowing bold and italic tags to persist for the rich text editor.">
const HEADING_LEVEL_2_REGEX = /^##\s+/;
const HEADING_LEVEL_3_REGEX = /^###\s+/;
const ORDERED_LIST_REGEX = /^\d+\.\s+/;
const UNORDERED_LIST_REGEX = /^[-*]\s+/;
const BLOCKQUOTE_REGEX = /^>\s?/;
const HORIZONTAL_RULE_REGEX = /^(-{3,}|_{3,}|\*{3,})$/;
const CALLOUT_START_REGEX = /^:::\s*([a-z0-9_-]+)\s*$/i;
const CALLOUT_END_REGEX = /^:::\s*$/;

const FONT_SIZE_MAP: Record<string, number> = {
  "1": 12,
  "2": 14,
  "3": 16,
  "4": 18,
  "5": 22,
  "6": 26,
  "7": 32,
};

const DEFAULT_FONT_SIZE_PX = 16;

const SIZE_TOKEN_REGEX = /\{\{(\/?size(?::\d{1,3})?)\}\}/gi;
const SIZE_TOKEN_OPEN_PREFIX = "size:";
const SIZE_TOKEN_CLOSE = "/size";
const MIN_ALLOWED_FONT_SIZE = 10;
const MAX_ALLOWED_FONT_SIZE = 200;

function clampFontSize(value: number): number | null {
  if (!Number.isFinite(value)) return null;
  const rounded = Math.round(value);
  if (rounded < MIN_ALLOWED_FONT_SIZE || rounded > MAX_ALLOWED_FONT_SIZE) return null;
  return rounded;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderInlineWithSizeTokens(text: string): string {
  let result = "";
  let lastIndex = 0;
  const stack: number[] = [];

  SIZE_TOKEN_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = SIZE_TOKEN_REGEX.exec(text)) !== null) {
    const [fullMatch, rawBody] = match;
    const index = match.index;

    if (index > lastIndex) {
      result += escapeHtml(text.slice(lastIndex, index));
    }

    const body = (rawBody || "").toLowerCase();

    if (body.startsWith(SIZE_TOKEN_CLOSE)) {
      if (stack.length > 0) {
        stack.pop();
        result += "</span>";
      } else {
        result += escapeHtml(fullMatch);
      }
    } else if (body.startsWith(SIZE_TOKEN_OPEN_PREFIX)) {
      const sizeStr = body.slice(SIZE_TOKEN_OPEN_PREFIX.length);
      const size = clampFontSize(Number(sizeStr));
      if (size) {
        stack.push(size);
        result += `<span data-font-size="${size}" style="font-size: ${size}px;">`;
      } else {
        result += escapeHtml(fullMatch);
      }
    } else {
      result += escapeHtml(fullMatch);
    }

    lastIndex = index + fullMatch.length;
  }

  if (lastIndex < text.length) {
    result += escapeHtml(text.slice(lastIndex));
  }

  while (stack.length > 0) {
    stack.pop();
    result += "</span>";
  }

  return result;
}

function wrapWithSizeTokens(content: string, size: number): string {
  const normalized = clampFontSize(size);
  if (!normalized) return content;
  return `{{size:${normalized}}}${content}{{/size}}`;
}

function detectFontSizeValue(element: HTMLElement): number | null {
  const dataAttr = element.getAttribute("data-font-size");
  if (dataAttr && /^\d{1,3}$/.test(dataAttr)) {
    const parsed = clampFontSize(Number(dataAttr));
    if (parsed) return parsed;
  }

  const inlineSize = element.style?.fontSize;
  if (inlineSize) {
    const parsed = clampFontSize(parseFloat(inlineSize));
    if (parsed) return parsed;
  }

  const attrStyle = element.getAttribute("style") ?? "";
  if (attrStyle) {
    const match = attrStyle.match(/font-size\s*:\s*([0-9.]+)\s*px/i);
    if (match) {
      const parsed = clampFontSize(Number(match[1]));
      if (parsed) return parsed;
    }
  }

  return null;
}

export function convertTextToHtml(value: string): string {
  const lines = value.split(/\r?\n/);
  const blocks: string[] = [];
  let currentList: { type: "ul" | "ol"; items: string[] } | null = null;
  let currentBlockquote: string[] = [];
  let currentCallout: { type: string; lines: string[] } | null = null;

  const flushList = () => {
    if (!currentList) return;
    const tag = currentList.type;
    const items = currentList.items
      .map((item) => `<li>${renderInlineWithSizeTokens(item)}</li>`)
      .join("");
    blocks.push(`<${tag}>${items}</${tag}>`);
    currentList = null;
  };

  const flushBlockquote = () => {
    if (!currentBlockquote.length) return;
    const paragraphs = currentBlockquote
      .join("\n")
      .split(/\n{2,}/)
      .map((para) => `<p>${renderInlineWithSizeTokens(para.trim())}</p>`)
      .join("");
    blocks.push(`<blockquote>${paragraphs}</blockquote>`);
    currentBlockquote = [];
  };

  const flushCallout = () => {
    if (!currentCallout) return;
    const content = currentCallout.lines.join("\n").trim();
    const paragraphs = content
      ? content
          .split(/\n{2,}/)
          .map((para) => `<p>${renderInlineWithSizeTokens(para.trim())}</p>`)
          .join("")
      : "";
    const typeAttr = escapeAttribute(currentCallout.type || "info");
    blocks.push(`<div data-callout="${typeAttr}">${paragraphs}</div>`);
    currentCallout = null;
  };

  const pushParagraph = (text: string) => {
    blocks.push(`<p>${renderInlineWithSizeTokens(text)}</p>`);
  };

  lines.forEach((lineRaw) => {
    const line = lineRaw.replace(/\r$/, "");
    const trimmed = line.trim();

    if (!trimmed) {
      if (currentCallout) {
        currentCallout.lines.push("");
      } else {
        flushList();
        flushBlockquote();
        blocks.push("");
      }
      return;
    }

    const calloutStart = trimmed.match(CALLOUT_START_REGEX);
    if (calloutStart) {
      flushList();
      flushBlockquote();
      flushCallout();
      currentCallout = { type: calloutStart[1].toLowerCase(), lines: [] };
      return;
    }

    if (currentCallout) {
      if (CALLOUT_END_REGEX.test(trimmed)) {
        flushCallout();
        return;
      }
      currentCallout.lines.push(line);
      return;
    }

    if (CALLOUT_END_REGEX.test(trimmed)) {
      pushParagraph(trimmed);
      return;
    }

    if (BLOCKQUOTE_REGEX.test(trimmed)) {
      flushList();
      const content = line.replace(BLOCKQUOTE_REGEX, "");
      currentBlockquote.push(content);
      return;
    } else {
      flushBlockquote();
    }

    if (HORIZONTAL_RULE_REGEX.test(trimmed.replace(/\s+/g, ""))) {
      flushList();
      blocks.push("<hr />");
      return;
    }

    if (HEADING_LEVEL_3_REGEX.test(trimmed)) {
      flushList();
      blocks.push(
        `<h3>${renderInlineWithSizeTokens(trimmed.replace(HEADING_LEVEL_3_REGEX, "").trim())}</h3>`
      );
      return;
    }

    if (HEADING_LEVEL_2_REGEX.test(trimmed)) {
      flushList();
      blocks.push(
        `<h2>${renderInlineWithSizeTokens(trimmed.replace(HEADING_LEVEL_2_REGEX, "").trim())}</h2>`
      );
      return;
    }

    if (UNORDERED_LIST_REGEX.test(trimmed)) {
      const content = trimmed.replace(UNORDERED_LIST_REGEX, "").trim();
      if (!currentList || currentList.type !== "ul") {
        flushList();
        currentList = { type: "ul", items: [] };
      }
      currentList.items.push(content);
      return;
    }

    if (ORDERED_LIST_REGEX.test(trimmed)) {
      const content = trimmed.replace(ORDERED_LIST_REGEX, "").trim();
      if (!currentList || currentList.type !== "ol") {
        flushList();
        currentList = { type: "ol", items: [] };
      }
      currentList.items.push(content);
      return;
    }

    flushList();
    pushParagraph(line.trim());
  });

  flushList();
  flushBlockquote();
  flushCallout();

  const merged: string[] = [];
  let skipEmpty = true;

  blocks.forEach((block) => {
    if (!block) {
      if (!skipEmpty) merged.push("");
      skipEmpty = true;
    } else {
      merged.push(block);
      skipEmpty = false;
    }
  });

  return merged.join("");
}

function collectInlineText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? "").replace(/\u00a0/g, " ");
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const element = node as HTMLElement;
  const tag = element.tagName.toLowerCase();

  if (tag === "br") {
    return "\n";
  }

  const inner = Array.from(element.childNodes).map(collectInlineText).join("");
  const fontSize = tag === "span" ? detectFontSizeValue(element) : null;

  if (fontSize) {
    return wrapWithSizeTokens(inner, fontSize);
  }

  return inner;
}

function normalizeInlineText(text: string): string {
  return text.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function extractParagraphText(element: HTMLElement): string {
  const text = collectInlineText(element);
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ");
}

function convertListNode(element: HTMLElement, ordered: boolean): string[] {
  const items: string[] = [];
  Array.from(element.children).forEach((child, index) => {
    if (!(child instanceof HTMLElement)) return;
    const content = extractParagraphText(child);
    if (!content) return;
    if (ordered) {
      items.push(`${index + 1}. ${content}`);
    } else {
      items.push(`- ${content}`);
    }
  });
  return items;
}

function detectCalloutType(element: HTMLElement): string | null {
  if (element.dataset.callout) {
    return element.dataset.callout.toLowerCase();
  }
  const classList = Array.from(element.classList);
  const prefixed = classList.find((cls) => cls.startsWith("callout-"));
  if (prefixed) {
    return prefixed.replace("callout-", "").toLowerCase();
  }
  if (classList.includes("callout")) {
    return "info";
  }
  return null;
}

function nodeToBlocks(node: Node): string[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = normalizeInlineText(node.textContent ?? "");
    return text ? [text] : [];
  }

  if (!(node instanceof HTMLElement)) {
    return [];
  }

  const element = node as HTMLElement;
  const tag = element.tagName.toLowerCase();

  switch (tag) {
    case "p": {
      const text = extractParagraphText(element);
      return text ? [text] : [];
    }
    case "h1": {
      const text = extractParagraphText(element);
      return text ? [`# ${text}`] : [];
    }
    case "h2": {
      const text = extractParagraphText(element);
      return text ? [`## ${text}`] : [];
    }
    case "h3": {
      const text = extractParagraphText(element);
      return text ? [`### ${text}`] : [];
    }
    case "ul": {
      const items = convertListNode(element, false);
      return items.length ? [items.join("\n")] : [];
    }
    case "ol": {
      const items = convertListNode(element, true);
      return items.length ? [items.join("\n")] : [];
    }
    case "blockquote": {
      const raw = collectInlineText(element)
        .split(/\n{2,}/)
        .map((segment) => segment.trim())
        .filter(Boolean);
      if (!raw.length) return [];
      const blocks = raw.map((segment) =>
        segment
          .split(/\n+/)
          .map((line) => `> ${line.trim()}`)
          .join("\n")
      );
      return [blocks.join("\n\n")];
    }
    case "hr":
      return ["---"];
    case "div": {
      const calloutType = detectCalloutType(element);
      if (calloutType) {
        const innerBlocks: string[] = [];
        Array.from(element.childNodes).forEach((child) => {
          innerBlocks.push(...nodeToBlocks(child));
        });
        const trimmedBlocks = innerBlocks.filter((block) => block.trim().length > 0);
        const content = trimmedBlocks.join("\n\n");
        const lines = [`::: ${calloutType}`];
        if (content) {
          lines.push(content);
        }
        lines.push(":::");
        return [lines.join("\n")];
      }
      const collected: string[] = [];
      Array.from(element.childNodes).forEach((child) => {
        collected.push(...nodeToBlocks(child));
      });
      return collected;
    }
    case "br":
      return [];
    case "span": {
      const content = collectInlineText(element);
      return content ? [content] : [];
    }
    case "strong":
    case "em":
    case "u":
    case "del":
    case "s":
    case "a": {
      const collected: string[] = [];
      Array.from(element.childNodes).forEach((child) => {
        collected.push(...nodeToBlocks(child));
      });
      return collected;
    }
    default: {
      const collected: string[] = [];
      Array.from(element.childNodes).forEach((child) => {
        collected.push(...nodeToBlocks(child));
      });
      return collected;
    }
  }
}

export function convertHtmlToText(html: string): string {
  if (typeof window === "undefined") return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
  const blocks: string[] = [];

  Array.from(doc.body.childNodes).forEach((node) => {
    blocks.push(...nodeToBlocks(node));
  });

  const cleaned: string[] = [];
  blocks.forEach((block) => {
    const trimmed = block.replace(/\s+$/g, "").replace(/^\s+/g, "");
    if (!trimmed) {
      if (cleaned.length === 0 || cleaned[cleaned.length - 1] === "") return;
      cleaned.push("");
      return;
    }
    cleaned.push(trimmed);
  });

  return cleaned.join("\n\n");
}

function filterStyleAttribute(element: HTMLElement) {
  if (!element.hasAttribute("style")) return;

  const style = element.getAttribute("style");
  if (!style) {
    element.removeAttribute("style");
    return;
  }

  const allowed = [
    "font-size",
    "font-weight",
    "font-style",
    "text-decoration",
    "text-align",
  ];

  const filtered = style
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [propertyRaw, valueRaw] = part.split(":");
      if (!propertyRaw || !valueRaw) return null;
      const property = propertyRaw.trim().toLowerCase();
      const value = valueRaw.trim();

      if (!allowed.includes(property)) return null;

      if (property === "text-decoration") {
        const normalized = value.toLowerCase();
        if (!["underline", "line-through"].includes(normalized)) return null;
        return `${property}: ${normalized}`;
      }

      if (property === "text-align") {
        const normalized = value.toLowerCase();
        if (!["left", "right", "center", "justify"].includes(normalized)) {
          return null;
        }
        return `${property}: ${normalized}`;
      }

      if (property === "font-size") {
        const match = value.match(/([0-9.]+)/);
        if (!match) return null;
        const normalized = clampFontSize(Number(match[1]));
        if (!normalized) return null;
        element.setAttribute("data-font-size", String(normalized));
        return `${property}: ${normalized}px`;
      }

  ...