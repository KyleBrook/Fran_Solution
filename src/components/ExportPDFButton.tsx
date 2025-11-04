import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { showError, showLoading, showSuccess, dismissToast } from "@/utils/toast";
import { exportA4PagesToPDF } from "@/utils/pdf-export";
import { supabase } from "@/integrations/supabase/client";
import { useEntitlements } from "@/features/subscription/useEntitlements";
import { getMonthlyExportCount } from "@/features/subscription/usage";
import { uploadPdfToSupabase } from "@/integrations/supabase/storage";
import { useTranslation } from "react-i18next";

type ExportPDFButtonProps = {
  filename?: string;
  disabled?: boolean;
  className?: string;
  titleForHistory?: string;
};

const ExportPDFButton: React.FC<ExportPDFButtonProps> = ({
  filename = "document.pdf",
  disabled = false,
  className,
  titleForHistory,
}) => {
  const { monthlyExportLimit, watermarkRequired } = useEntitlements();
  const { t } = useTranslation("create-pdf");

  const handleExport = async () => {
    const toastId = showLoading(t("export.loading"));
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        showError(t("export.needLogin"));
        return;
      }

      const used = await getMonthlyExportCount(user.id);
      if (used >= monthlyExportLimit) {
        showError(t("export.limitReached"));
        setTimeout(() => {
          window.location.href = "/upgrade";
        }, 500);
        return;
      }

      const pdfBlob = await exportA4PagesToPDF(filename, {
        watermarkText: watermarkRequired ? "Generated with EbookFy" : undefined,
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

      showSuccess(t("export.success"));
    } catch (e) {
      console.error(e);
      showError(t("export.error"));
    } finally {
      dismissToast(toastId);
    }
  };

  return (
    <Button onClick={handleExport} disabled={disabled} className={className}>
      <Download className="mr-2 h-4 w-4" />
      {t("buttons.exportPdf")}
    </Button>
  );
};

export default ExportPDFButton;