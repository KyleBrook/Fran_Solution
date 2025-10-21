import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import Seo from "@/components/Seo";
import { useEntitlements } from "@/features/subscription/useEntitlements";
import { useNavigate } from "react-router-dom";

const Feature: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-start gap-2 text-sm">
    <Check className="mt-0.5 h-4 w-4 text-emerald-600" />
    <span>{children}</span>
  </div>
);

export default function Upgrade() {
  const { planId } = useEntitlements();
  const navigate = useNavigate();

  const detectCurrency = (): "brl" | "usd" => {
    const lang = (navigator.language || "").toLowerCase();
    if (lang.includes("pt-br")) return "brl";
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      if (tz.toLowerCase().includes("sao_paulo") || tz.toLowerCase().includes("america/sao_paulo")) {
        return "brl";
      }
    } catch {}
    return "usd";
  };

  const goToCheckout = (plan: "basic" | "pro") => {
    const currency = detectCurrency();
    navigate(`/checkout?plan=${plan}&currency=${currency}`);
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 py-10">
      <Seo title="Upgrade de Plano — EbookFy" description="Escolha um plano para continuar exportando sem limites e com IA." />
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold">Escolha seu plano</h1>
          <p className="text-sm text-muted-foreground">
            Seu plano atual: <span className="font-medium uppercase">{planId}</span>
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          <Card className="border-emerald-200">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Free <Badge variant="secondary">Grátis</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold">R$ 0</div>
              <Feature>1 eBook/mês</Feature>
              <Feature>Marca d’água</Feature>
              <Feature>Sem IA</Feature>
              <Button variant="outline" className="w-full" disabled>
                Atual
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Basic <Badge>Recomendado</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold">R$ 12,90</div>
              <div className="text-xs text-muted-foreground">ou US$ 3/mês</div>
              <Feature>10 eBooks/mês</Feature>
              <Feature>Sem marca d’água</Feature>
              <Feature>IA inclusa</Feature>
              <Button className="w-full" onClick={() => goToCheckout("basic")}>
                Assinar Basic
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold">R$ 24,90</div>
              <div className="text-xs text-muted-foreground">ou US$ 5/mês</div>
              <Feature>50 eBooks/mês</Feature>
              <Feature>Sem marca d’água</Feature>
              <Feature>IA inclusa</Feature>
              <Button className="w-full" onClick={() => goToCheckout("pro")}>
                Assinar Pro
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}