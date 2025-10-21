import React from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LogOut, FileText, User, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import Seo from "@/components/Seo";

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

  const total = history?.length ?? 0;
  const last = history?.[0];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
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

        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="history">Histórico de PDFs</TabsTrigger>
            <TabsTrigger value="account">Conta</TabsTrigger>
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
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Email: </span>
                  <span className="font-medium">{user?.email}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Use o botão "Sair" acima para encerrar a sessão.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;