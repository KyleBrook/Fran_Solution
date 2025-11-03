import React, { useEffect } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import Seo from "@/components/Seo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";

const Login: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("auth");

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/dashboard`
      : "https://ebookfy.pro/dashboard";

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white to-gray-50 flex items-center justify-center p-4">
      <Seo
        title="Entrar - EbookFy - Ebook em Segundos"
        description="Acesse sua conta para ver seu dashboard e histórico de PDFs."
      />
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-6">
          <div className="flex justify-end">
            <LanguageSwitcher />
          </div>
          <div className="text-center space-y-2">
            <CardTitle className="text-xl">{t("login.title")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("login.subtitle")}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Auth
            supabaseClient={supabase}
            providers={[]}
            appearance={{ theme: ThemeSupa }}
            theme="light"
            redirectTo={redirectTo}
            localization={{
              variables: {
                data: {
                  sign_in: {
                    email_label: "E-mail",
                    email_input_placeholder: "email@exemplo.com",
                  },
                },
              },
              lang: i18n.resolvedLanguage || i18n.language || "pt",
            }}
          />
          <p className="text-xs text-muted-foreground text-center">{t("login.noAccount")}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;