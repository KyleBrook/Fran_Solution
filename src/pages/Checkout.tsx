import React from "react";
import { useSearchParams, Link } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { STRIPE_PUBLISHABLE_KEY } from "@/config/stripe";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Seo from "@/components/Seo";
import { useTranslation } from "react-i18next";

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

export default function Checkout() {
  const [search] = useSearchParams();
  const planParam = (search.get("plan") as "basic" | "pro") || "basic";
  const currency = (search.get("currency") as "brl" | "usd") || "usd";
  const { t } = useTranslation("checkout");

  const planLabel = t(`plans.${planParam}.label`);

  const fetchClientSecret = React.useCallback(async () => {
    const { data, error } = await supabase.functions.invoke<{ client_secret: string }>(
      "create-checkout-session",
      {
        body: {
          planId: planParam,
          currency,
          uiMode: "embedded",
          returnUrl: `${window.location.origin}/dashboard`,
        },
      }
    );
    if (error) throw error;
    const client_secret = (data as any)?.client_secret;
    if (!client_secret) throw new Error("client_secret missing");
    return client_secret;
  }, [planParam, currency]);

  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    fetchClientSecret()
      .then((cs) => active && setClientSecret(cs))
      .catch((err) => {
        console.error(err);
        if (active) setErrorMsg(t("info.error"));
      });
    return () => {
      active = false;
    };
  }, [fetchClientSecret, t]);

  return (
    <div className="min-h-screen w-full bg-gray-50 py-8">
      <Seo
        title={t("seo.title")}
        description={t("seo.description")}
      />
      <div className="container mx-auto px-4 max-w-3xl">
        <Card className="overflow-hidden">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>{t("heading.title", { plan: planLabel })}</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link to="/upgrade">{t("actions.back")}</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              {t("info.subscription")}
            </p>
            {errorMsg ? (
              <div className="text-sm text-red-600">{errorMsg}</div>
            ) : !clientSecret ? (
              <div className="text-sm text-muted-foreground">{t("info.loading")}</div>
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