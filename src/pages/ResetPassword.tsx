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

const ResetPassword: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
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
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-xl">Definir nova senha</CardTitle>
          <p className="text-sm text-muted-foreground">
            Informe uma nova senha para continuar usando sua conta.
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center">Carregando…</p>
          ) : !user ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                O link de redefinição expirou ou é inválido. Solicite um novo link e tente novamente.
              </p>
              <Button asChild variant="outline">
                <Link to="/login">Voltar para o login</Link>
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova senha</Label>
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
                <Label htmlFor="confirm-password">Confirme a nova senha</Label>
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
                {submitting ? "Salvando..." : "Atualizar senha"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Após salvar, você será redirecionado automaticamente para o dashboard.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;