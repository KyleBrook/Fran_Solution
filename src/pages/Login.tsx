import React, { useEffect } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import Seo from "@/components/Seo";

const Login: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

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
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-xl">Entrar no EbookFy</CardTitle>
          <p className="text-sm text-muted-foreground">Use seu email para acessar</p>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            providers={[]}
            appearance={{ theme: ThemeSupa }}
            theme="light"
            redirectTo={redirectTo}
          />
          <p className="mt-3 text-xs text-muted-foreground text-center">
            Caso não receba o e-mail, verifique a caixa de SPAM. Se persistir, o envio de e-mails pode não estar configurado no Supabase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;