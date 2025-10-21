import React from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { LogOut, FileText, User, BookOpen, CreditCard, Sparkles, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Seo from "@/components/Seo";
import { showError, showLoading, showSuccess, dismissToast } from "@/utils/toast";
import { useEntitlements } from "@/features/subscription/useEntitlements";
import { getMonthlyExportCount } from "@/features/subscription/usage";

type PdfHistory = {
  id: string;
  user_id: string;
  title: string | null;
  filename: string;
  pages: number | null;
  created_at: string;
};

const Dashboard: React.FC = () => {
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleManageSubscription = async () => {
    const toastId = showLoading("Abrindo gerenciador de assinatura...");
    try {
      const { data, error } = await supabase.functions.invoke<{ url?: string; error?: string }>(
        "create-portal-session",
        { body: { returnUrl: `${window.location.origin}/dashboard` } }
      );
      if (error || !data?.url) {
        showError("Você ainda não possui assinatura ativa. Escolha um plano para começar.");
        navigate("/upgrade");
        return;
      }
      showSuccess("Redirecionando para o portal da Stripe...");
      window.location.href = data.url!;
    } catch (e) {
      console.error(e);
      showError("Não foi possível abrir o portal da assinatura. Tente novamente.");
    } finally {
      dismissToast(toastId);
    }
  };

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
    <div className="min-h-screen w-full bg-gray-50">
      <Seo title="Dashboard - EbookFy - Ebook em Segundos" description="Veja seu resumo, histórico de PDFs e dados da conta." />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">Dashboard</h1>
              {isAdmin && <Badge variant="secondary">Admin</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              Bem-vindo{user?.email ? `, ${user.email}` : ""}!
            </p>
          </div>

        <div className="flex items-center gap-2">
            <Button asChild className="shadow-md">
              <Link to="/criar-pdf" aria-label="Criar PDF">
                <BookOpen className="mr-2 h-4 w-4" />
                Criar PDF
              </Link>
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>

        {planId === "free" && (
          <Alert className="mb-6">
            <Sparkles className="h-5 w-5" />
            <AlertTitle>Você tem 1 eBook gratuito por mês</AlertTitle>
            <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span>
                {monthlyUsed === 0
                  ? "Aproveite seu eBook gratuito."
                  : `Você já utilizou ${monthlyUsed} de 1 eBook gratuito este mês.`}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" asChild>
                  <Link to="/criar-pdf">Criar agora</Link>
                </Button>
                <Button size="sm" onClick={() => navigate("/upgrade")}>
                  Fazer upgrade <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="history">Histórico de PDFs</TabsTrigger>
            <TabsTrigger value="account">Conta</TabsTrigger>
            <TabsTrigger value="plans">Planos</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" /> Total de PDFs exportados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{isLoading ? "…" : total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" /> Último exportado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-sm text-muted-foreground">Carregando…</div>
                  ) : last ? (
                    <div className="text-sm">
                      <div className="font-medium break-all">{last.title || last.filename}</div>
                      <div className="text-muted-foreground">
                        {new Date(last.created_at).toLocaleString()} • {last.pages ?? "-"} pág.
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Nenhum PDF exportado ainda.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Histórico de PDFs</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-sm text-muted-foreground">Carregando…</div>
                ) : !history || history.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Nenhum registro encontrado.</div>
                ) : (
                  <div className="w-full overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Título</TableHead>
                          <TableHead>Arquivo</TableHead>
                          <TableHead className="text-right">Páginas</TableHead>
                          <TableHead>Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {history.map((h) => (
                          <TableRow key={h.id}>
                            <TableCell className="max-w-[240px] truncate" title={h.title || ""}>
                              {h.title || "-"}
                            </TableCell>
                            <TableCell className="break-all">{h.filename}</TableCell>
                            <TableCell className="text-right">{h.pages ?? "-"}</TableCell>
                            <TableCell>
                              {new Date(h.created_at).toLocaleString()}
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
                  <User className="h-5 w-5" /> Informações da Conta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm">
                  <span className="text-muted-foreground">Email: </span>
                  <span className="font-medium">{user?.email}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={handleManageSubscription}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Gerenciar assinatura
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  Use o botão acima para alterar plano, atualizar cartão, cancelar ou ver faturas.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans" className="mt-4">
            <div className="grid gap-6 md:grid-cols-2 max-w-4xl">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Basic <Badge>Recomendado</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-3xl font-bold">R$ 12,90</div>
                  <ul className="text-sm space-y-1">
                    <li>• 10 eBooks/mês</li>
                    <li>• Sem marca d’água</li>
                    <li>• IA inclusa</li>
                  </ul>
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
                  <ul className="text-sm space-y-1">
                    <li>• 50 eBooks/mês</li>
                    <li>• Sem marca d’água</li>
                    <li>• IA inclusa</li>
                  </ul>
                  <Button className="w-full" onClick={() => goToCheckout("pro")}>
                    Assinar Pro
                  </Button>
                </CardContent>
              </Card>
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              Todos os planos são por assinatura mensal. Você pode cancelar a qualquer momento em Conta &gt; Gerenciar assinatura.
            </p>

            <div className="mt-4 text-sm text-muted-foreground">
              Quer ver mais detalhes? Visite a página completa de planos.
              <Button variant="link" className="px-1" asChild>
                <Link to="/upgrade">Abrir página de Upgrade</Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;