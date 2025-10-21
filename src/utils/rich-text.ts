const HEADING_LEVEL_2_REGEX = /^##\s+/;
const HEADING_LEVEL_3_REGEX = /^###\s+/;
const ORDERED_LIST_REGEX = /^\d+\.\s+/;
const UNORDERED_LIST_REGEX = /^[-*]\s+/;

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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function wrapList(items: string[], type: "ul" | "ol") {
  if (items.length === 0) return "";
  const tag = type === "ul" ? "ul" : "ol";
  return `<${tag}>${items.map((item) => `<li>${item}</li>`).join("")}</${tag}>`;
}

export function convertTextToHtml(value: string): string {
  const lines = value.split(/\r?\n/);
  const blocks: string[] = [];
  let currentList: { type: "ul" | "ol"; items: string[] } | null = null;

  const flushList = () => {
    if (currentList) {
      blocks.push(wrapList(currentList.items, currentList.type));
      currentList = null;
    }
  };

  lines.forEach((lineRaw) => {
    const line = lineRaw.trimEnd();
    if (!line.trim()) {
      flushList();
      blocks.push("");
      return;
    }

    if (HEADING_LEVEL_3_REGEX.test(line)) {
      flushList();
      blocks.push(`<h3>${escapeHtml(line.replace(HEADING_LEVEL_3_REGEX, "").trim())}</h3>`);
      return;
    }

    if (HEADING_LEVEL_2_REGEX.test(line)) {
      flushList();
      blocks.push(`<h2>${escapeHtml(line.replace(HEADING_LEVEL_2_REGEX, "").trim())}</h2>`);
      return;
    }

    if (UNORDERED_LIST_REGEX.test(line)) {
      const content = escapeHtml(line.replace(UNORDERED_LIST_REGEX, "").trim());
      if (!currentList) {
        currentList = { type: "ul", items: [] };
      } else if (currentList.type !== "ul") {
        flushList();
        currentList = { type: "ul", items: [] };
      }
      currentList.items.push(content);
      return;
    }

    if (ORDERED_LIST_REGEX.test(line)) {
      const content = escapeHtml(line.replace(ORDERED_LIST_REGEX, "").trim());
      if (!currentList) {
        currentList = { type: "ol", items: [] };
      } else if (currentList.type !== "ol") {
        flushList();
        currentList = { type: "ol", items: [] };
      }
      currentList.items.push(content);
      return;
    }

    flushList();
    blocks.push(`<p>${escapeHtml(line.trim())}</p>`);
  });

  flushList();

  const merged: string[] = [];
  let skipEmpty = true;
  blocks.forEach((block) => {
    if (!block) {
      if (!skipEmpty) merged.push("");
      skipEmpty = true;
      return;
    }
    merged.push(block);
    skipEmpty = false;
  });

  return merged.join("");
}

export function convertHtmlToText(html: string): string {
  if (typeof window === "undefined") return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
  const output: string[] = [];

  Array.from(doc.body.childNodes).forEach((node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === "h2") {
      const content = el.textContent?.trim();
      if (content) output.push(`## ${content}`);
      return;
    }

    if (tag === "h3") {
      const content = el.textContent?.trim();
      if (content) output.push(`### ${content}`);
      return;
    }

    if (tag === "p") {
      const content = el.textContent?.trim();
      if (content) output.push(content);
      return;
    }

    if (tag === "ul" || tag === "ol") {
      const isOrdered = tag === "ol";
      Array.from(el.children).forEach((li, index) => {
        const text = li.textContent?.trim();
        if (!text) return;
        if (isOrdered) {
          output.push(`${index + 1}. ${text}`);
        } else {
          output.push(`- ${text}`);
        }
      });
      return;
    }
  });

  return output.join("\n\n");
}

function filterStyleAttribute(element: HTMLElement) {
  if (!element.hasAttribute("style")) return;

  const style = element.getAttribute("style");
  if (!style) {
    element.removeAttribute("style");
    return;
  }

  const allowed = ["font-size", "font-weight", "font-style", "text-decoration"];
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
      if (property === "text-decoration" && value !== "underline") return null;
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
  const mapped = FONT_SIZE_MAP[sizeAttr] ?? DEFAULT_FONT_SIZE_PX;
  span.style.fontSize = `${mapped}px`;
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
  ]);

  const cleanNode = (node: Node) => {
    if (node.nodeType === Node.COMMENT_NODE) {
      node.parentNode?.removeChild(node);
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    let element = node as HTMLElement;

    if (element.tagName.toLowerCase() === "font") {
      element = convertFontTag(element);
    }

    const tag = element.tagName.toLowerCase();

    if (!allowed.has(tag)) {
      const parent = element.parentNode;
      if (!parent) return;
      while (element.firstChild) {
        parent.insertBefore(element.firstChild, element);
      }
      parent.removeChild(element);
      return;
    }

    Array.from(element.attributes).forEach((attr) => {
      if (attr.name.toLowerCase() !== "style") {
        element.removeAttribute(attr.name);
      }
    });

    if (tag === "span") {
      filterStyleAttribute(element);
    } else {
      element.removeAttribute("style");
    }

    Array.from(element.childNodes).forEach((child) => cleanNode(child));
  };

  Array.from(doc.body.childNodes).forEach((child) => cleanNode(child));

  return doc.body.innerHTML.trim();
}

export const EDITOR_FONT_SIZES = [16, 18, 20, 22, 24, 26, 28, 32];