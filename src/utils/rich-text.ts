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
    .replace(/</g, "&gt;")
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

      return `${property}: ${value}`;
    })
    .filter(Boolean)
    .join("; ");

  if (filtered) {
    element.setAttribute("style", filtered);
  } else {
    element.removeAttribute("style");
  }
}

function convertFontTag(fontEl: HTMLElement) {
  const span = fontEl.ownerDocument.createElement("span");
  const sizeAttr = fontEl.getAttribute("size") ?? "";
  const mapped =
    FONT_SIZE_MAP[sizeAttr] ??
    clampFontSize(parseInt(sizeAttr, 10)) ??
    DEFAULT_FONT_SIZE_PX;
  span.style.fontSize = `${mapped}px`;
  span.setAttribute("data-font-size", String(mapped));
  span.innerHTML = fontEl.innerHTML;
  fontEl.replaceWith(span);
  return span;
}

export function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
  const allowed = new Set([
    "p",
    "h1",
    "h2",
    "h3",
    "strong",
    "em",
    "u",
    "span",
    "ul",
    "ol",
    "li",
    "br",
    "blockquote",
    "hr",
    "div",
    "a",
    "del",
    "b",
    "i",
  ]);

  const cleanNode = (node: Node) => {
    if (node.nodeType === Node.COMMENT_NODE) {
      node.parentNode?.removeChild(node);
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    let element = node as HTMLElement;
    const tag = element.tagName.toLowerCase();

    if (tag === "font") {
      element = convertFontTag(element);
    } else if (tag === "strike" || tag === "s") {
      const del = doc.createElement("del");
      Array.from(element.childNodes).forEach((child) => del.appendChild(child));
      element.replaceWith(del);
      element = del;
    }

    const normalizedTag = element.tagName.toLowerCase();
    if (!allowed.has(normalizedTag)) {
      const parent = element.parentNode;
      if (!parent) return;
      while (element.firstChild) {
        parent.insertBefore(element.firstChild, element);
      }
      parent.removeChild(element);
      return;
    }

    Array.from(element.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      if (name === "style") return;

      if (normalizedTag === "span" && name === "data-font-size") {
        const value = element.getAttribute("data-font-size") ?? "";
        const numeric = clampFontSize(Number(value));
        if (!numeric) {
          element.removeAttribute("data-font-size");
          return;
        }
        element.setAttribute("data-font-size", String(numeric));
        element.style.fontSize = `${numeric}px`;
        return;
      }

      if (normalizedTag === "a") {
        if (name === "href") {
          const value = element.getAttribute("href") ?? "";
          if (!/^https?:\/\//i.test(value) && !/^mailto:/i.test(value)) {
            element.removeAttribute("href");
          }
          return;
        }
        if (name === "target") {
          element.setAttribute("rel", "noopener noreferrer");
          return;
        }
        if (name === "rel") {
          return;
        }
      }

      if (normalizedTag === "div" && name === "data-callout") {
        return;
      }

      if (
        ["p", "h1", "h2", "h3", "span", "div"].includes(normalizedTag) &&
        name === "data-align"
      ) {
        const value = element.getAttribute("data-align")?.toLowerCase() ?? "";
        if (["left", "right", "center", "justify"].includes(value)) {
          return;
        }
      }

      element.removeAttribute(attr.name);
    });

    if (
      ["span", "p", "h1", "h2", "h3", "div"].includes(normalizedTag) &&
      element.hasAttribute("style")
    ) {
      filterStyleAttribute(element);
    } else {
      element.removeAttribute("style");
    }

    Array.from(element.childNodes).forEach((child) => cleanNode(child));
  };

  Array.from(doc.body.childNodes).forEach((child) => cleanNode(child));

  return doc.body.innerHTML.trim();
}