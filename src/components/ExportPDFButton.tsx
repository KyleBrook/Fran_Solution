import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { showError, showLoading, showSuccess, dismissToast } from "@/utils/toast";
import { exportA4PagesToPDF } from "@/utils/pdf-export";
import { supabase } from "@/integrations/supabase/client";

type ExportPDFButtonProps = {
  filename?: string;
  disabled?: boolean;
  className?: string;
  titleForHistory?: string; // Título opcional para salvar no histórico
};

const ExportPDFButton: React.FC<ExportPDFButtonProps> = ({
  filename = "documento.pdf",
  disabled = false,
  className,
  titleForHistory,
}) => {
  const handleExport = async () => {
    const toastId = showLoading("Exportando PDF...");
    try {
      await exportA4PagesToPDF(filename);
      showSuccess("PDF exportado com sucesso!");

      // Se o usuário estiver autenticado, registrar no histórico
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const pages = Array.from(document.querySelectorAll(".page")).length || null;
        await supabase.from("pdf_history").insert({
          user_id: user.id,
          title: titleForHistory || document.title || null,
          filename,
          pages,
        });
      }
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