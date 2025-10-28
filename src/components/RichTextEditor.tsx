import React from "react";
import { createPortal } from "react-dom";
import { sanitizeHtml } from "@/utils/rich-text";

type FontSizeSettings = {
  body?: number;
  h1?: number;
  h2?: number;
  h3?: number;
};

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  fontSizes?: FontSizeSettings;
};

type FormatState = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  orderedList: boolean;
  unorderedList: boolean;
  fontSize: number | null;
};

const FONT_SIZE_OPTIONS = [16, 18, 20, 22, 24, 26];

const DEFAULT_STATE: FormatState = {
  bold: false,
  italic: false,
  underline: false,
  orderedList: false,
  unorderedList: false,
  fontSize: null,
};

let globalStylesInjected = false;

const ensureGlobalStyles = () => {
  if (globalStylesInjected || typeof document === "undefined") return;

  const style = document.createElement("style");
  style.setAttribute("data-rich-text-editor", "true");
  style.textContent = `
    [data-rich-text-editor] {
      font-size: var(--rte-body-size, 20px);
      line-height: var(--rte-body-line-height, 1.65);
    }
    [data-rich-text-editor] p,
    [data-rich-text-editor] li,
    [data-rich-text-editor] div,
    [data-rich-text-editor] blockquote {
      font-size: inherit;
      line-height: inherit;
    }
    [data-rich-text-editor] blockquote {
      border-left: 4px solid rgba(15, 23, 42, 0.15);
      padding-left: 1rem;
      margin: 0.75rem 0;
      font-style: italic;
    }
    [data-rich-text-editor] h1 {
      font-size: var(--rte-h1-size, 40px);
      line-height: var(--rte-heading-line-height, 1.2);
    }
    [data-rich-text-editor] h2 {
      font-size: var(--rte-h2-size, 28px);
      line-height: var(--rte-heading-line-height, 1.25);
    }
    [data-rich-text-editor] h3 {
      font-size: var(--rte-h3-size, 24px);
      line-height: var(--rte-heading-line-height, 1.3);
    }
    [data-rich-text-editor] ul,
    [data-rich-text-editor] ol {
      padding-left: 1.5rem;
      margin: 0.75rem 0;
    }
    [data-rich-text-editor] ul {
      list-style-type: disc;
      list-style-position: outside;
    }
    [data-rich-text-editor] ol {
      list-style-type: decimal;
      list-style-position: outside;
    }
    [data-rich-text-editor] li + li {
      margin-top: 0.25rem;
    }
  `;
  document.head.appendChild(style);
  globalStylesInjected = true;
};

const getPlainText = (html: string) => {
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || "").replace(/\s+/g, " ").trim();
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Digite ou cole seu conteúdo aqui.",
  className,
  fontSizes,
}) => {
  const editorRef = React.useRef<HTMLDivElement | null>(null);
  const selectionRef = React.useRef<Range | null>(null);
  const lastValueRef = React.useRef<string>("");
  const skipNextEffectRef = React.useRef(false);

  const [showToolbar, setShowToolbar] = React.useState(false);
  const [toolbarPosition, setToolbarPosition] = React.useState({ x: 0, y: 0 });
  const [formatState, setFormatState] = React.useState<FormatState>(DEFAULT_STATE);

  React.useEffect(() => {
    ensureGlobalStyles();
  }, []);

  const computedSizes = React.useMemo(
    () => ({
      body: fontSizes?.body ?? 20,
      h1: fontSizes?.h1 ?? 40,
      h2: fontSizes?.h2 ?? 28,
      h3: fontSizes?.h3 ?? 24,
    }),
    [fontSizes],
  );

  const cssVars = React.useMemo<React.CSSProperties>(() => {
    const vars: React.CSSProperties = {};
    (vars as any)["--rte-body-size"] = `${computedSizes.body}px`;
    (vars as any)["--rte-h1-size"] = `${computedSizes.h1}px`;
    (vars as any)["--rte-h2-size"] = `${computedSizes.h2}px`;
    (vars as any)["--rte-h3-size"] = `${computedSizes.h3}px`;
    (vars as any)["--rte-body-line-height"] = "1.65";
    (vars as any)["--rte-heading-line-height"] = "1.2";
    return vars;
  }, [computedSizes]);

  const sanitizedValue = React.useMemo(() => sanitizeHtml(value || ""), [value]);

  React.useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    if (skipNextEffectRef.current) {
      skipNextEffectRef.current = false;
      lastValueRef.current = sanitizedValue;
      return;
    }

    if (editor.innerHTML !== sanitizedValue) {
      editor.innerHTML = sanitizedValue;
    }
    lastValueRef.current = sanitizedValue;
  }, [sanitizedValue]);

  const restoreSelection = React.useCallback(() => {
    if (typeof window === "undefined") return false;
    const selection = window.getSelection();
    const saved = selectionRef.current;
    if (!selection || !saved) return false;
    selection.removeAllRanges();
    try {
      selection.addRange(saved);
      return true;
    } catch {
      return false;
    }
  }, []);

  const updateToolbar = React.useCallback(() => {
    if (typeof window === "undefined") return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setShowToolbar(false);
      selectionRef.current = null;
      setFormatState(DEFAULT_STATE);
      return;
    }

    const range = selection.getRangeAt(0);
    const editor = editorRef.current;
    if (!editor || !editor.contains(range.commonAncestorContainer) || selection.isCollapsed) {
      setShowToolbar(false);
      selectionRef.current = null;
      setFormatState(DEFAULT_STATE);
      return;
    }

    const rect = range.getBoundingClientRect();
    if (!rect || (rect.height === 0 && rect.width === 0)) {
      setShowToolbar(false);
      selectionRef.current = null;
      setFormatState(DEFAULT_STATE);
      return;
    }

    selectionRef.current = range.cloneRange();
    setToolbarPosition({ x: rect.left + rect.width / 2, y: rect.top });

    setFormatState({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      orderedList: document.queryCommandState("insertOrderedList"),
      unorderedList: document.queryCommandState("insertUnorderedList"),
      fontSize: (() => {
        const selectionNode = range.startContainer.parentElement;
        if (!selectionNode) return null;
        const computed = window.getComputedStyle(selectionNode).fontSize;
        const parsed = parseFloat(computed);
        return Number.isFinite(parsed) ? Math.round(parsed) : null;
      })(),
    });

    setShowToolbar(true);
  }, []);

  React.useEffect(() => {
    const handleSelectionChange = () => updateToolbar();
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, [updateToolbar]);

  React.useEffect(() => {
    const hideToolbar = () => setShowToolbar(false);
    window.addEventListener("scroll", hideToolbar, true);
    window.addEventListener("resize", hideToolbar);
    return () => {
      window.removeEventListener("scroll", hideToolbar, true);
      window.removeEventListener("resize", hideToolbar);
    };
  }, []);

  const handleInput = React.useCallback(() => {
    if (!editorRef.current) return;
    const rawHtml = editorRef.current.innerHTML;
    const clean = sanitizeHtml(rawHtml);
    if (clean !== rawHtml) {
      skipNextEffectRef.current = true;
      editorRef.current.innerHTML = clean;
      restoreSelection();
    }
    if (clean !== lastValueRef.current) {
      skipNextEffectRef.current = true;
      lastValueRef.current = clean;
      onChange(clean);
    }
    requestAnimationFrame(updateToolbar);
  }, [onChange, restoreSelection, updateToolbar]);

  const applyCommand = React.useCallback(
    (command: string, valueArg?: string) => {
      const editor = editorRef.current;
      if (!editor) return;
      editor.focus();
      if (!restoreSelection()) return;
      document.execCommand(command, false, valueArg);
      handleInput();
    },
    [handleInput, restoreSelection],
  );

  const applyFontSize = React.useCallback(
    (size: number) => {
      const editor = editorRef.current;
      if (!editor || !restoreSelection()) return;

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      if (range.collapsed) return;

      const span = document.createElement("span");
      span.style.fontSize = `${size}px`;
      span.setAttribute("data-font-size", String(size));
      span.appendChild(range.extractContents());
      range.insertNode(span);

      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      selection.addRange(newRange);

      handleInput();
    },
    [handleInput, restoreSelection],
  );

  const handlePaste = React.useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>) => {
      event.preventDefault();
      const htmlData = event.clipboardData.getData("text/html");
      const textData = event.clipboardData.getData("text/plain");
      const editor = editorRef.current;
      if (!editor) return;
      editor.focus();
      restoreSelection();

      if (htmlData) {
        const clean = sanitizeHtml(htmlData);
        document.execCommand("insertHTML", false, clean);
      } else if (textData) {
        document.execCommand("insertText", false, textData);
      }
      handleInput();
    },
    [handleInput, restoreSelection],
  );

  const isEmpty = React.useMemo(() => getPlainText(sanitizedValue).length === 0, [sanitizedValue]);

  return (
    <div className={className}>
      <div className="relative">
        {isEmpty && (
          <div className="pointer-events-none absolute inset-0 px-3 py-2 text-sm text-muted-foreground">
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          role="textbox"
          aria-label="Editor de texto"
          contentEditable
          suppressContentEditableWarning
          spellCheck
          data-rich-text-editor="true"
          className="min-h-[220px] w-full rounded-md border bg-white px-3 py-2 text-base leading-relaxed shadow-sm outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
          style={cssVars}
          onInput={handleInput}
          onPaste={handlePaste}
          onKeyUp={updateToolbar}
          onMouseUp={updateToolbar}
          onBlur={() => setShowToolbar(false)}
          onFocus={() => requestAnimationFrame(updateToolbar)}
        />
      </div>

      {showToolbar &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed z-50"
            style={{
              top: toolbarPosition.y,
              left: toolbarPosition.x,
              transform: "translate(-50%, calc(-100% - 12px))",
            }}
          >
            <div className="flex items-center gap-1 rounded-md border bg-popover px-2 py-1 text-popover-foreground shadow-lg">
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applyCommand("bold")}
                className={`rounded-sm px-2 py-1 text-xs font-semibold transition ${
                  formatState.bold ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                N
              </button>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applyCommand("italic")}
                className={`rounded-sm px-2 py-1 text-xs font-semibold italic transition ${
                  formatState.italic ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                /
              </button>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applyCommand("underline")}
                className={`rounded-sm px-2 py-1 text-xs font-semibold underline transition ${
                  formatState.underline ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                S
              </button>

              <span className="mx-1 h-5 w-px bg-border" />

              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applyCommand("insertUnorderedList")}
                className={`rounded-sm px-2 py-1 text-xs transition ${
                  formatState.unorderedList ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                Lista
              </button>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applyCommand("insertOrderedList")}
                className={`rounded-sm px-2 py-1 text-xs transition ${
                  formatState.orderedList ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                1·2·3
              </button>

              <span className="mx-1 h-5 w-px bg-border" />

              <label className="flex items-center gap-1 text-[0.7rem] font-semibold">
                Tamanho
                <select
                  className="rounded border bg-background px-1 py-0.5 text-xs focus:outline-none"
                  value={
                    formatState.fontSize && FONT_SIZE_OPTIONS.includes(formatState.fontSize)
                      ? formatState.fontSize
                      : ""
                  }
                  onChange={(event) => {
                    const selected = Number(event.target.value);
                    if (Number.isFinite(selected)) {
                      applyFontSize(selected);
                    }
                  }}
                >
                  <option value="">Auto</option>
                  {FONT_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}px
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default RichTextEditor;