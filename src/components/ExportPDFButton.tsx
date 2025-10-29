import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { showError, showLoading, showSuccess, dismissToast } from "@/utils/toast";
import { exportA4PagesToPDF } from "@/utils/pdf-export";
import { supabase } from "@/integrations/supabase/client";
import { useEntitlements } from "@/features/subscription/useEntitlements";
import { getMonthlyExportCount } from "@/features/subscription/usage";
import { uploadPdfToSupabase } from "@/integrations/supabase/storage";

type ExportPDFButtonProps = {
  filename?: string;
  disabled?: boolean;
  className?: string;
  titleForHistory?: string;
};

const ExportPDFButton: React.FC<ExportPDFButtonProps> = ({
  filename = "documento.pdf",
  disabled = false,
  className,
  titleForHistory,
}) => {
  const { monthlyExportLimit, watermarkRequired } = useEntitlements();

  const handleExport = async () => {
    const toastId = showLoading("Exportando PDF...");
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        showError("Você precisa estar logado para exportar.");
        return;
      }

      const used = await getMonthlyExportCount(user.id);
      if (used >= monthlyExportLimit) {
        showError("Você atingiu o limite de exportações do seu plano. Atualize para continuar.");
        setTimeout(() => {
          window.location.href = "/upgrade";
        }, 500);
        return;
      }

      const pdfBlob = await exportA4PagesToPDF(filename, {
        watermarkText: watermarkRequired ? "Gerado no EbookFy" : undefined,
      });

      const pdfFile = new File([pdfBlob], filename, { type: "application/pdf" });
      const pdfUrl = await uploadPdfToSupabase(pdfFile, {
        folder: `pdf_exports/${user.id}`,
      });

      const pages = Array.from(document.querySelectorAll(".page")).length || null;

      await supabase.from("pdf_history").insert({
        user_id: user.id,
        title: titleForHistory || document.title || null,
        filename,
        pages,
        file_url: pdfUrl,
      });

      showSuccess("PDF exportado com sucesso!");
    } catch (e) {
      console.error(e);
      showError("Não foi possível exportar o PDF.");
    } finally {
      dismissToast(toastId);
    }
  };

  return (
    <Button onClick={handleExport} disabled={disabled} className={className}>
      <Download className="mr-2 h-4 w-4" />
      Exportar PDF
    </Button>
  );
};

export default ExportPDFButton;