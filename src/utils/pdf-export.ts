import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export async function exportA4PagesToPDF(filename = "documento.pdf") {
  const pages = Array.from(document.querySelectorAll(".page")) as HTMLElement[];
  if (pages.length === 0) {
    throw new Error("Nenhuma página encontrada para exportar.");
  }

  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

  for (let i = 0; i < pages.length; i++) {
    const el = pages[i];

    const canvas = await html2canvas(el, {
      scale: 2, // alta qualidade
      useCORS: true,
      backgroundColor: "#ffffff",
      // onclone: (clonedDoc) => {
      //   // espaço para ajustes finos se necessário
      // },
    });

    const imgData = canvas.toDataURL("image/png");
    if (i > 0) doc.addPage("a4", "p");
    doc.addImage(imgData, "PNG", 0, 0, 210, 297, undefined, "FAST");
  }

  doc.save(filename);
}