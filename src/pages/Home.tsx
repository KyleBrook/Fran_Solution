import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import Seo from "@/components/Seo";

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white to-gray-50">
      <Seo
        title="EbookFy - Ebook em Segundos"
        description="Ebook em Segundos."
        image="https://nolrnrwzeurbimcnjlwm.supabase.co/storage/v1/object/public/Luma__Fran/logo-1.jpg"
        url="https://ebookfy.pro"
      />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <Card className="overflow-hidden">
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl md:text-3xl">
                Bem-vindo(a) ao Gerador de eBook em PDF
              </CardTitle>
              <p className="text-muted-foreground">
                Crie um PDF com capa e conteúdo paginado automaticamente em formato A4.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-gray-700">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border p-4 bg-white">
                    <h3 className="font-semibold mb-1">1. Escreva</h3>
                    <p className="text-sm text-muted-foreground">
                      Defina título, subtítulo e cole seu texto.
                    </p>
                  </div>
                  <div className="rounded-lg border p-4 bg-white">
                    <h3 className="font-semibold mb-1">2. Organize</h3>
                    <p className="text-sm text-muted-foreground">
                      Deixe a paginação automática dividir o conteúdo em páginas A4.
                    </p>
                  </div>
                  <div className="rounded-lg border p-4 bg-white">
                    <h3 className="font-semibold mb-1">3. Exporte</h3>
                    <p className="text-sm text-muted-foreground">
                      Baixe o PDF pronto para imprimir ou compartilhar.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                  <Button size="lg" asChild>
                    <Link to="/criar-pdf">
                      <BookOpen className="mr-2 h-5 w-5" />
                      Criar eBook
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/">
                      Ver exemplo pronto
                    </Link>
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  Dica: você pode usar a IA para organizar conteúdo e ajustar o tom do texto antes de exportar.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}