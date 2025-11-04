import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import Seo from "@/components/Seo";
import { useEntitlements } from "@/features/subscription/useEntitlements";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

type PlanCardTranslation = {
  title: string;
  badge?: string;
  price: string;
  features: string[];
  cta: string;
  ctaCurrent?: string;
};

type PlanCardConfig = {
  id: "free" | "basic" | "pro";
  data: PlanCardTranslation;
  onClick?: () => void;
  disabled?: boolean;
  buttonVariant?: "outline" | "default";
  cardClassName?: string;
  badgeVariant?: "default" | "secondary";
};

const Feature: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-start gap-2 text-sm text-muted-foreground">
    <Check className="mt-0.5 h-4 w-4 text-emerald-600" />
    <span>{children}</span>
  </div>
);

export default function Upgrade() {
  const { planId } = useEntitlements();
  const navigate = useNavigate();
  const { t } = useTranslation("upgrade");

  const planLabels = t("planLabels", { returnObjects: true }) as Record<string, string>;
  const currentPlanLabel = planLabels[planId] ?? planId;

  const detectCurrency = React.useCallback((): "brl" | "usd" => {
    if (typeof navigator === "undefined") return "usd";
    const lang = (navigator.language || "").toLowerCase();
    if (lang.includes("pt-br")) return "brl";
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      if (tz.toLowerCase().includes("sao_paulo")) {
        return "brl";
      }
    } catch {
      // ignore timezone lookup errors
    }
    return "usd";
  }, []);

  const goToCheckout = React.useCallback(
    (plan: "basic" | "pro") => {
      const currency = detectCurrency();
      navigate(`/checkout?plan=${plan}&currency=${currency}`);
    },
    [detectCurrency, navigate],
  );

  const planConfig = t("planCards", { returnObjects: true }) as Record<string, PlanCardTranslation>;

  const planCards = React.useMemo<PlanCardConfig[]>(() => {
    const cards: PlanCardConfig[] = [];
    if (planConfig.free) {
      cards.push({
        id: "free",
        data: planConfig.free,
        disabled: true,
        buttonVariant: "outline",
        cardClassName: "border-emerald-200",
        badgeVariant: "secondary",
      });
    }
    if (planConfig.basic) {
      cards.push({
        id: "basic",
        data: planConfig.basic,
        onClick: () => goToCheckout("basic"),
      });
    }
    if (planConfig.pro) {
      cards.push({
        id: "pro",
        data: planConfig.pro,
        onClick: () => goToCheckout("pro"),
      });
    }
    return cards;
  }, [goToCheckout, planConfig]);

  return (
    <div className="min-h-screen w-full bg-gray-50 py-10">
      <Seo title={t("seo.title")} description={t("seo.description")} />
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold">{t("heading.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("heading.subtitle")}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("currentPlanPrefix")}{" "}
            <span className="font-medium uppercase">{currentPlanLabel}</span>
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {planCards.map((plan) => {
            const isCurrentPlan = plan.id === planId;
            const buttonLabel = isCurrentPlan
              ? plan.data.ctaCurrent ?? plan.data.cta
              : plan.data.cta;
            const buttonVariant: "default" | "outline" = isCurrentPlan
              ? "outline"
              : plan.buttonVariant ?? "default";
            const buttonDisabled = plan.disabled || isCurrentPlan || !plan.onClick;

            return (
              <Card
                key={plan.id}
                className={plan.cardClassName ? plan.cardClassName : undefined}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {plan.data.title}
                    {plan.data.badge ? (
                      <Badge variant={plan.badgeVariant}>{plan.data.badge}</Badge>
                    ) : null}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-3xl font-bold">{plan.data.price}</div>
                  {plan.data.features.map((feature, index) => (
                    <Feature key={`${plan.id}-feature-${index}`}>{feature}</Feature>
                  ))}
                  <Button
                    className="w-full"
                    variant={buttonVariant}
                    disabled={buttonDisabled}
                    onClick={buttonDisabled ? undefined : plan.onClick}
                  >
                    {buttonLabel}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("notes.subscriptionHelp")}
        </p>
      </div>
    </div>
  );
}