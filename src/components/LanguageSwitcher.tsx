import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type LanguageSwitcherProps = {
  className?: string;
};

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className }) => {
  const { i18n, t } = useTranslation("common");
  const { user } = useAuth();
  const [isSaving, setIsSaving] = React.useState(false);

  const currentLanguage = (i18n.resolvedLanguage || i18n.language || "pt").split("-")[0];

  const handleChange = async (lang: string) => {
    if (lang === currentLanguage) return;

    setIsSaving(true);
    try {
      await i18n.changeLanguage(lang);

      if (typeof window !== "undefined") {
        window.localStorage.setItem("lang", lang);
      }

      if (user) {
        const { error } = await supabase
          .from("user_preferences")
          .upsert({ user_id: user.id, language: lang }, { onConflict: "user_id" });

        if (error) {
          console.error("Failed to persist language preference", error);
        }
      }
    } catch (error) {
      console.error("Failed to change language", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Select value={currentLanguage} onValueChange={handleChange}>
      <SelectTrigger
        className={cn("w-[180px] justify-between", className)}
        disabled={isSaving}
      >
        <SelectValue placeholder={t("language.portuguese")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pt">{t("language.portuguese")}</SelectItem>
        <SelectItem value="en">{t("language.english")}</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default LanguageSwitcher;