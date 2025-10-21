import React from "react";
import { useSearchParams, Link } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { STRIPE_PUBLISHABLE_KEY } from "@/config/stripe";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Seo from "@/components/Seo";

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

export default function Checkout() {
  const [search] = useSearchParams();
  const plan = (search.get("plan") as "basic" | "pro") || "basic";
  const currency = (search.get("currency") as "brl" | "usd") || "usd";

  const fetchClientSecret = React.useCallback(async () => {
    const { data, error } = await supabase.functions.invoke<{ client_secret: string }>(
      "create-checkout-session",
      {
        body: {
          planId: plan,
          currency,
          uiMode: "embedded",
          returnUrl: `${window.location.origin}/dashboard`,
        },
      }
    );
    if (error) throw error;
    const client_secret = (data as any)?.client_secret;
    if (!client_secret) throw new Error("client_secret não recebido");
    return client_secret;
  }, [plan, currency]);

  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    fetchClientSecret()
      .then((cs) => active && setClientSecret(cs))
      .catch((err) => {
        console.error(err);
        if (active) setErrorMsg("Não foi possível iniciar o checkout. Tente novamente.");
      });
    return () => {
      active = false;
    };
  }, [fetchClientSecret]);

  return (
    <div className="min-h-screen w-full bg-gray-50 py-8">
      <Seo title="Checkout — EbookFy" description="Finalize sua assinatura sem sair do site." />
      <div className="container mx-auto px-4 max-w-3xl">
        <Card className="overflow-hidden">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Pagamento — Plano {plan.toUpperCase()}</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link to="/upgrade">Voltar</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Esta é uma assinatura mensal. Você pode cancelar a qualquer momento em Dashboard &gt; Conta &gt; Gerenciar assinatura.
            </p>
            {errorMsg ? (
              <div className="text-sm text-red-600">{errorMsg}</div>
            ) : !clientSecret ? (
              <div className="text-sm text-muted-foreground">Carregando checkout…</div>
            ) : (
              <div id="checkout" className="w-full">
                <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
                  <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}