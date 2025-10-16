import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { showError, showLoading, showSuccess, dismissToast } from "@/utils/toast";
import { exportA4PagesToPDF } from "@/utils/pdf-export";

type ExportPDFButtonProps = {
  filename?: string;
  disabled?: boolean;
  className?: string;
};

const ExportPDFButton: React.FC<ExportPDFButtonProps> = ({
  filename = "documento.pdf",
  disabled = false,
  className,
}) => {
  const handleExport = async () => {
    const toastId = showLoading("Exportando PDF...");
    try {
      await exportA4PagesToPDF(filename);
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