import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import Seo from "@/components/Seo";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";

const ResetPassword: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation("auth");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!password || password.length < 6) {
      showError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirm) {
      showError("As senhas informadas não coincidem.");
      return;
    }

    if (!user) {
      showError("Sessão inválida. Solicite novamente o link de redefinição.");
      return;
    }

    setSubmitting(true);
    const toastId = showLoading("Atualizando senha...");
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      showSuccess("Senha atualizada com sucesso!");
      setPassword("");
      setConfirm("");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error(error);
      showError("Não foi possível atualizar a senha. Tente novamente.");
    } finally {
      dismissToast(toastId);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white to-gray-50 flex items-center justify-center px-4 py-10">
      <Seo
        title="Redefinir senha — EbookFy"
        description="Defina uma nova senha para acessar sua conta EbookFy."
      />
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-6">
          <div className="flex justify-end">
            <LanguageSwitcher />
          </div>
          <div className="text-center space-y-2">
            <CardTitle className="text-xl">{t("resetPassword.title")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("resetPassword.subtitle")}</p>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center">{t("login.loading")}</p>
          ) : !user ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">{t("resetPassword.invalidSession")}</p>
              <Button asChild variant="outline">
                <Link to="/login">{t("resetPassword.backToLogin")}</Link>
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="new-password">{t("resetPassword.newPassword")}</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">{t("resetPassword.confirmPassword")}</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? t("resetPassword.saving") : t("resetPassword.submit")}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                {t("resetPassword.successRedirect")}
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;