import React from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  LogOut,
  FileText,
  User,
  BookOpen,
  CreditCard,
  Sparkles,
  ArrowRight,
  UserPlus,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Seo from "@/components/Seo";
import {
  showError,
  showLoading,
  showSuccess,
  dismissToast,
} from "@/utils/toast";
import { useEntitlements } from "@/features/subscription/useEntitlements";
import { getMonthlyExportCount } from "@/features/subscription/usage";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";

type PdfHistory = {
  id: string;
  user_id: string;
  title: string | null;
  filename: string;
  pages: number | null;
  created_at: string;
  file_url: string | null;
};

const Dashboard: React.FC = () => {
  const { t } = useTranslation("dashboard");
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { planId } = useEntitlements();

  const { data: history, isLoading } = useQuery({
    queryKey: ["pdf_history"],
    queryFn: async (): Promise<PdfHistory[]> => {
      const { data, error } = await supabase
        .from("pdf_history")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: monthlyUsed = 0 } = useQuery({
    queryKey: ["monthly_export_count", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      return user ? await getMonthlyExportCount(user.id) : 0;
    },
  });

  const total = history?.length ?? 0;
  const last = history?.[0];

  const greeting = user?.email
    ? t("heading.welcomeWithEmail", { email: user.email })
    : t("heading.welcome");

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleManageSubscription = async () => {
    const toastId = showLoading(t("messages.openSubscriptionManager"));
    try {
      const { data, error } = await supabase.functions.invoke<{
        url?: string;
        error?: string;
      }>("create-portal-session", {
        body: { returnUrl: `${window.location.origin}/dashboard` },
      });
      if (error || !data?.url) {
        showError(t("messages.missingSubscription"));
        navigate("/upgrade");
        return;
      }
      showSuccess(t("messages.redirectingPortal"));
      window.location.href = data.url!;
    } catch (e) {
      console.error(e);
      showError(t("messages.portalError"));
    } finally {
      dismissToast(toastId);
    }
  };

  const detectCurrency = (): "brl" | "usd" => {
    const lang = (navigator.language || "").toLowerCase();
    if (lang.includes("pt-br")) return "brl";
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      if (
        tz.toLowerCase().includes("sao_paulo") ||
        tz.toLowerCase().includes("america/sao_paulo")
      ) {
        return "brl";
      }
    } catch {
      // ignore
    }
    return "usd";
  };

  const goToCheckout = (plan: "basic" | "pro") => {
    const currency = detectCurrency();
    navigate(`/checkout?plan=${plan}&currency=${currency}`);
  };

  const [whitelistEmail, setWhitelistEmail] = React.useState("");

  const handleAddToWhitelist = async () => {
    const email = (whitelistEmail || "").trim();
    if (!email) {
      showError(t("messages.invalidEmail"));
      return;
    }
    const toastId = showLoading(
      t("messages.addingToWhitelist", { email }),
    );
    try {
      const { data, error } = await supabase.functions.invoke<{
        ok?: boolean;
        error?: string;
      }>("whitelist", { body: { action: "add", email } });
      if (error || !data?.ok) {
        showError(data?.error || t("messages.whitelistError"));
        return;
      }
      showSuccess(t("messages.whitelistSuccess"));
    } catch (e) {
      console.error(e);
      showError(t("messages.whitelistError"));
    } finally {
      dismissToast(toastId);
    }
  };

  const freePlanMessage =
    monthlyUsed === 0
      ? t("alerts.freePlanMessageUnused")
      : t("alerts.freePlanMessageUsed", { used: monthlyUsed });

  const pagesLabel =
    last?.pages != null
      ? t("history.pagesCount", { count: last.pages })
      : t("history.pagesUnknown");

  const planCards = React.useMemo(
    () => [
      {
        id: "basic" as const,
        label: t("plans.basic.label"),
        badge: t("plans.basic.badge"),
        price: t("plans.basic.price"),
        features: t("plans.basic.features", {
          returnObjects: true,
        }) as string[],
        button: t("plans.basic.button"),
        onClick: () => goToCheckout("basic"),
      },
      {
        id: "pro" as const,
        label: t("plans.pro.label"),
        badge: "",
        price: t("plans.pro.price"),
        features: t("plans.pro.features", {
          returnObjects: true,
        }) as string[],
        button: t("plans.pro.button"),
        onClick: () => goToCheckout("pro"),
      },
    ],
    [t],
  );

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <Seo title={t("seo.title")} description={t("seo.description")} />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{t("heading.title")}</h1>
              {isAdmin && (
                <Badge variant="secondary">
                  {t("header.adminBadge")}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{greeting}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              className="shadow-md"
              aria-label={t("buttons.createPdf")}
            >
              <Link to="/criar-pdf">
                <BookOpen className="mr-2 h-4 w-4" />
                {t("buttons.createPdf")}
              </Link>
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              {t("buttons.signOut")}
            </Button>
          </div>
        </div>

        {planId === "free" && (
          <Alert className="mb-6">
            <Sparkles className="h-5 w-5" />
            <AlertTitle>{t("alerts.freePlanTitle")}</AlertTitle>
            <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span>{freePlanMessage}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" asChild>
                  <Link to="/criar-pdf">{t("buttons.createNow")}</Link>
                </Button>
                <Button size="sm" onClick={() => navigate("/upgrade")}>
                  {t("buttons.upgrade")}{" "}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
            <TabsTrigger value="history">{t("tabs.history")}</TabsTrigger>
            <TabsTrigger value="account">{t("tabs.account")}</TabsTrigger>
            <TabsTrigger value="plans">{t("tabs.plans")}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" /> {t("cards.totalExports")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {isLoading ? t("states.loading") : total}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" /> {t("cards.lastExport")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-sm text-muted-foreground">
                      {t("states.loading")}
                    </div>
                  ) : last ? (
                    <div className="text-sm">
                      <div className="font-medium break-all">
                        {last.title || last.filename}
                      </div>
                      <div className="text-muted-foreground">
                        {new Date(last.created_at).toLocaleString()} •{" "}
                        {pagesLabel}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {t("history.none")}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>{t("history.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-sm text-muted-foreground">
                    {t("states.loading")}
                  </div>
                ) : !history || history.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    {t("history.empty")}
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("table.headers.title")}</TableHead>
                          <TableHead>{t("table.headers.file")}</TableHead>
                          <TableHead className="text-right">
                            {t("table.headers.pages")}
                          </TableHead>
                          <TableHead>{t("table.headers.date")}</TableHead>
                          <TableHead className="text-right">
                            {t("table.headers.actions")}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {history.map((h) => (
                          <TableRow key={h.id}>
                            <TableCell
                              className="max-w-[240px] truncate"
                              title={h.title || undefined}
                            >
                              {h.title || "-"}
                            </TableCell>
                            <TableCell className="break-all">
                              {h.filename}
                            </TableCell>
                            <TableCell className="text-right">
                              {h.pages ?? "-"}
                            </TableCell>
                            <TableCell>
                              {new Date(h.created_at).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              {h.file_url ? (
                                <Button variant="outline" size="sm" asChild>
                                  <a
                                    href={h.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    {t("buttons.openPdf")}
                                  </a>
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  {t("table.notAvailable")}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" /> {t("account.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm">
                  <span className="text-muted-foreground">
                    {t("account.emailLabel")}:{" "}
                  </span>
                  <span className="font-medium">{user?.email}</span>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {t("account.languageLabel")}
                  </p>
                  <LanguageSwitcher className="sm:max-w-xs" />
                  <p className="text-xs text-muted-foreground">
                    {t("account.languageHelp")}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    <Button variant="secondary" onClick={handleManageSubscription}>
                      <CreditCard className="mr-2 h-4 w-4" />
                      {t("buttons.manageSubscription")}
                    </Button>
                  </div>

                  {isAdmin && (
                    <div className="mt-4 rounded-md border p-3 bg-white">
                      <div className="text-sm font-medium mb-2">
                        {t("account.whitelist.title")}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          type="email"
                          placeholder={t("account.whitelist.placeholder")}
                          value={whitelistEmail}
                          onChange={(e) => setWhitelistEmail(e.target.value)}
                          className="sm:max-w-xs"
                        />
                        <Button variant="outline" onClick={handleAddToWhitelist}>
                          <UserPlus className="mr-2 h-4 w-4" />
                          {t("buttons.addToWhitelist")}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {t("account.whitelist.description")}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans" className="mt-4">
            <div className="grid gap-6 md:grid-cols-2 max-w-4xl">
              {planCards.map((plan) => (
                <Card key={plan.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{plan.label}</span>
                      {plan.badge ? (
                        <Badge variant="secondary">{plan.badge}</Badge>
                      ) : null}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-3xl font-bold">{plan.price}</div>
                    <ul className="text-sm space-y-1">
                      {plan.features.map((feature) => (
                        <li key={feature}>• {feature}</li>
                      ))}
                    </ul>
                    <Button className="w-full" onClick={plan.onClick}>
                      {plan.button}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              {t("plans.subscriptionHelp")}
            </p>

            <div className="mt-4 text-sm text-muted-foreground">
              {t("plans.moreDetails")}
              <Button variant="link" className="px-1" asChild>
                <Link to="/upgrade">{t("buttons.openUpgradePage")}</Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;