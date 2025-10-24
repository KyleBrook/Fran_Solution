import React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { sanitizeHtml } from "@/utils/rich-text";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
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

const DEFAULT_FORMAT_STATE: FormatState = {
  bold: false,
  italic: false,
  underline: false,
  orderedList: false,
  unorderedList: false,
  fontSize: null,
};

function getPlainText(html: string): string {
  if (!html) return "";
  if (typeof window === "undefined") {
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || "").replace(/\s+/g, " ").trim();
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Escreva ou cole seu conteúdo. Selecione trechos para formatar.",
  className,
}) => {
  const editorRef = React.useRef<HTMLDivElement | null>(null);
  const lastValueRef = React.useRef<string>("");
  const selectionRef = React.useRef<Range | null>(null);

  const [showToolbar, setShowToolbar] = React.useState(false);
  const [toolbarPos, setToolbarPos] = React.useState({ x: 0, y: 0 });
  const [formats, setFormats] = React.useState<FormatState>(DEFAULT_FORMAT_STATE);

  const sanitizedValue = React.useMemo(() => sanitizeHtml(value || ""), [value]);

  React.useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== sanitizedValue) {
      editorRef.current.innerHTML = sanitizedValue;
    }
    lastValueRef.current = sanitizedValue;
  }, [sanitizedValue]);

  const getCurrentFontSize = React.useCallback((): number | null => {
    if (typeof window === "undefined") return null;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    let node: Node | null = range.startContainer;

    if (!editorRef.current || !editorRef.current.contains(node)) return null;

    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }

    while (node && node !== editorRef.current) {
      if (node instanceof HTMLElement) {
        const size = parseFloat(window.getComputedStyle(node).fontSize);
        if (!Number.isNaN(size)) {
          return Math.round(size);
        }
      }
      node = node?.parentNode ?? null;
    }

    if (editorRef.current) {
      const size = parseFloat(window.getComputedStyle(editorRef.current).fontSize);
      if (!Number.isNaN(size)) {
        return Math.round(size);
      }
    }

    return null;
  }, []);

  const updateToolbar = React.useCallback(() => {
    if (typeof window === "undefined") return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      setShowToolbar(false);
      selectionRef.current = null;
      setFormats(DEFAULT_FORMAT_STATE);
      return;
    }

    const range = selection.getRangeAt(0);
    const editor = editorRef.current;
    if (!editor) {
      setShowToolbar(false);
      selectionRef.current = null;
      setFormats(DEFAULT_FORMAT_STATE);
      return;
    }

    if (selection.isCollapsed || !editor.contains(range.commonAncestorContainer)) {
      setShowToolbar(false);
      selectionRef.current = null;
      setFormats(DEFAULT_FORMAT_STATE);
      return;
    }

    const rect = range.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) {
      setShowToolbar(false);
      selectionRef.current = null;
      setFormats(DEFAULT_FORMAT_STATE);
      return;
    }

    selectionRef.current = range.cloneRange();
    setToolbarPos({
      x: rect.left + rect.width / 2,
      y: rect.top,
    });

    setFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      orderedList: document.queryCommandState("insertOrderedList"),
      unorderedList: document.queryCommandState("insertUnorderedList"),
      fontSize: getCurrentFontSize(),
    });
    setShowToolbar(true);
  }, [getCurrentFontSize]);

  React.useEffect(() => {
    const handleSelectionChange = () => updateToolbar();
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [updateToolbar]);

  React.useEffect(() => {
    const handleScroll = () => setShowToolbar(false);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const restoreSelection = React.useCallback(() => {
    if (typeof window === "undefined") return false;
    const selection = window.getSelection();
    const savedRange = selectionRef.current;
    if (!selection || !savedRange) return false;
    selection.removeAllRanges();
    try {
      selection.addRange(savedRange);
    } catch {
      return false;
    }
    return true;
  }, []);

  const handleInput = React.useCallback(() => {
    if (!editorRef.current) return;
    const rawHtml = editorRef.current.innerHTML;
    const clean = sanitizeHtml(rawHtml);
    if (clean !== rawHtml) {
      editorRef.current.innerHTML = clean;
      restoreSelection();
    }
    if (clean !== lastValueRef.current) {
      lastValueRef.current = clean;
      onChange(clean);
    }
    requestAnimationFrame(updateToolbar);
  }, [onChange, updateToolbar, restoreSelection]);

  const applyCommand = React.useCallback(
    (command: string, value?: string) => {
      if (typeof document === "undefined") return;
      editorRef.current?.focus();
      restoreSelection();
      document.execCommand(command, false, value);
      handleInput();
    },
    [handleInput, restoreSelection],
  );

  const applyFontSize = React.useCallback(
    (size: number) => {
      if (typeof window === "undefined") return;
      const selection = window.getSelection();
      editorRef.current?.focus();
      const restored = restoreSelection();
      if (!restored || !selection || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      if (range.collapsed) return;

      const span = document.createElement("span");
      span.style.fontSize = `${size}px`;
      span.setAttribute("data-font-size", size.toString());
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
      const html = event.clipboardData.getData("text/html");
      const text = event.clipboardData.getData("text/plain");
      editorRef.current?.focus();
      restoreSelection();

      if (html) {
        const clean = sanitizeHtml(html);
        document.execCommand("insertHTML", false, clean);
      } else {
        document.execCommand("insertText", false, text);
      }

      handleInput();
    },
    [handleInput, restoreSelection],
  );

  const isEmpty = React.useMemo(() => getPlainText(sanitizedValue).length === 0, [sanitizedValue]);

  return (
    <div className={cn("relative", className)}>
      {isEmpty && (
        <div className="pointer-events-none absolute inset-0 px-3 py-2 text-sm text-muted-foreground">
          {placeholder}
        </div>
      )}
      <div
        ref={editorRef}
        role="textbox"
        aria-label="Editor de texto rico"
        contentEditable
        suppressContentEditableWarning
        spellCheck
        data-placeholder={placeholder}
        lang="pt-BR"
        className={cn(
          "min-h-[240px] w-full rounded-md border bg-white px-3 py-2 text-base leading-relaxed shadow-sm outline-none transition",
          "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
          "prose prose-sm max-w-none whitespace-pre-wrap break-words hyphens-auto",
        )}
        onInput={handleInput}
        onPaste={handlePaste}
        onKeyUp={updateToolbar}
        onMouseUp={updateToolbar}
        onBlur={() => {
          setShowToolbar(false);
        }}
        onFocus={() => requestAnimationFrame(updateToolbar)}
      />
      {showToolbar &&
        createPortal(
          <div
            className="fixed z-50"
            style={{
              top: toolbarPos.y,
              left: toolbarPos.x,
              transform: "translate(-50%, calc(-100% - 12px))",
            }}
          >
            <div className="flex items-center gap-1 rounded-md border bg-popover px-2 py-1 text-popover-foreground shadow-lg">
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applyCommand("bold")}
                className={cn(
                  "rounded-sm px-2 py-1 text-xs font-semibold transition",
                  formats.bold
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted hover:text-foreground",
                )}
              >
                N
              </button>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applyCommand("italic")}
                className={cn(
                  "rounded-sm px-2 py-1 text-xs font-semibold italic transition",
                  formats.italic
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted hover:text-foreground",
                )}
              >
                /
              </button>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applyCommand("underline")}
                className={cn(
                  "rounded-sm px-2 py-1 text-xs font-semibold underline transition",
                  formats.underline
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted hover:text-foreground",
                )}
              >
                S
              </button>

              <span className="mx-1 h-5 w-px bg-border" aria-hidden />

              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applyCommand("insertUnorderedList")}
                className={cn(
                  "rounded-sm px-2 py-1 text-xs font-medium transition",
                  formats.unorderedList
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted hover:text-foreground",
                )}
              >
                Lista
              </button>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applyCommand("insertOrderedList")}
                className={cn(
                  "rounded-sm px-2 py-1 text-xs font-medium transition",
                  formats.orderedList
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted hover:text-foreground",
                )}
              >
                1·2·3
              </button>

              <span className="mx-1 h-5 w-px bg-border" aria-hidden />

              <label className="flex items-center gap-1 text-[0.7rem] font-semibold">
                Tamanho
                <select
                  className="rounded border bg-background px-1 py-0.5 text-xs focus:outline-none"
                  value={
                    formats.fontSize && FONT_SIZE_OPTIONS.includes(formats.fontSize)
                      ? formats.fontSize
                      : ""
                  }
                  onChange={(event) => {
                    const size = Number(event.target.value);
                    if (Number.isFinite(size)) {
                      applyFontSize(size);
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