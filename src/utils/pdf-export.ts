import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

type ExportOptions = {
  watermarkText?: string;
};

function addWatermark(pageEl: HTMLElement, text: string): HTMLElement {
  const overlay = document.createElement("div");
  overlay.style.position = "absolute";
  overlay.style.inset = "0";
  overlay.style.pointerEvents = "none";
  overlay.style.zIndex = "50";

  // container para múltiplas marcas diagonais
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.inset = "0";
  container.style.display = "grid";
  container.style.placeItems = "center";
  container.style.opacity = "0.12";

  // criar várias linhas para cobrir a página
  for (let i = 0; i < 5; i++) {
    const line = document.createElement("div");
    line.textContent = text;
    line.style.transform = "rotate(-30deg)";
    line.style.fontFamily = "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif";
    line.style.fontWeight = "800";
    line.style.letterSpacing = "1px";
    line.style.color = "#0f172a";
    line.style.fontSize = "48px";
    line.style.whiteSpace = "nowrap";
    line.style.userSelect = "none";
    line.style.margin = "40px 0";
    container.appendChild(line);
  }

  overlay.appendChild(container);
  pageEl.style.position = "relative";
  pageEl.appendChild(overlay);
  return overlay;
}

export async function exportA4PagesToPDF(filename = "documento.pdf", opts: ExportOptions = {}) {
  const pages = Array.from(document.querySelectorAll(".page")) as HTMLElement[];
  if (pages.length === 0) {
    throw new Error("Nenhuma página encontrada para exportar.");
  }

  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

  // Aplica marca d'água (se necessário)
  const overlays: HTMLElement[] = [];
  if (opts.watermarkText) {
    pages.forEach((el) => {
      overlays.push(addWatermark(el, opts.watermarkText!));
    });
  }

  try {
    for (let i = 0; i < pages.length; i++) {
      const el = pages[i];

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      if (i > 0) doc.addPage("a4", "p");
      doc.addImage(imgData, "PNG", 0, 0, 210, 297, undefined, "FAST");
    }

    doc.save(filename);
  } finally {
    // Remove overlays
    overlays.forEach((ov) => ov.parentElement?.removeChild(ov));
  }
}