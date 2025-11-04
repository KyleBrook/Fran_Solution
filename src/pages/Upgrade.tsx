import React from "react";  
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";  
import { Button } from "@/components/ui/button";  
import { Badge } from "@/components/ui/badge";  
import { Check } from "lucide-react";  
import Seo from "@/components/seo/Seo";  
import { useEntitlements } from "@/hooks/useEntitlements";  
import { useNavigate } from "react-router-dom";  
import { useTranslation } from "react-i18next";  
  
type PlanCardTranslation = {  
  title: string;  
  badge?: string;  
  price: string;  
  features: string[];  
  cta: string;  
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
  <div className="flex items-center space-x-2 text-sm text-muted-foreground">  
    <Check className="h-5 w-5 text-emerald-500" />  
    <span>{children}</span>  
  </div>  
);  
  
export default function Upgrade() {  
  const { planId } = useEntitlements();  
  const navigate = useNavigate();  
  const { t } = useTranslation("upgrade");  
  
  const planLabels = t("planLabels", { returnObjects: true }) as Record<string, string>;  
  const currentPlanLabel = planLabels[planId] ?? planId;  
  
  const goToCheckout = (plan: "basic" | "pro") => {  
    navigate(`/checkout?plan=${plan}`);  
  };  
  
  const planConfig = t("planCards", { returnObjects: true }) as Record<string, PlanCardTranslation>;  
  
  const planCards: PlanCardConfig[] = [];  
  
  if (planConfig.free) {  
    planCards.push({  
      id: "free",  
      data: planConfig.free,  
      disabled: true,  
      buttonVariant: "outline",  
      cardClassName: "border-emerald-200",  
      badgeVariant: "secondary",  
    });  
  }  
  if (planConfig.basic) {  
    planCards.push({  
      id: "basic",  
      data: planConfig.basic,  
      onClick: () => goToCheckout("basic"),  
      badgeVariant: "default",  
    });  
  }  
  if (planConfig.pro) {  
    planCards.push({  
      id: "pro",  
      data: planConfig.pro,  
      onClick: () => goToCheckout("pro"),  
      badgeVariant: "default",  
    });  
  }  
  
  return (  
    <div className="min-h-screen w-full bg-gray-50 py-10">  
      <Seo title={t("seo.title")} description={t("seo.description")} />  
      <div className="container mx-auto px-4">  
        <div className="text-center mb-8">  
          <h1 className="text-2xl font-semibold">{t("heading.title")}</h1>  
          <p className="text-sm text-muted-foreground">{t("heading.subtitle")}</p>  
          <p className="text-sm text-muted-foreground mt-2">  
            {t("currentPlanPrefix")}{" "}  
            <span className="font-medium uppercase">{currentPlanLabel}</span>  
          </p>  
        </div>  
  
        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">  
          {planCards.map((plan) => (  
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
                {plan.data.features.map((feature) => (  
                  <Feature key={feature}>{feature}</Feature>  
                ))}  
                <Button  
                  className="w-full"  
                  variant={plan.buttonVariant ?? "default"}  
                  disabled={plan.disabled}  
                  onClick={plan.onClick}  
                >  
                  {plan.data.cta}  
                </Button>  
              </CardContent>  
            </Card>  
          ))}  
        </div>  
  
        <p className="text-sm text-muted-foreground text-center mt-6">  
          {t("notes.subscriptionHelp")}  
        </p>  
      </div>  
    </div>  
  );  
}