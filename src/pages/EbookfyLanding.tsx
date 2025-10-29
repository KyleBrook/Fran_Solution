import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Seo from "@/components/Seo";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  PenSquare,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

const heroMetrics = [
  {
    value: "80%",
    label: "menos tempo em formatações manuais",
    description:
      "Clientes que migraram reduziram em até 80% o tempo gasto com montagem de PDFs.",
  },
  {
    value: "10x",
    label: "mais ebooks entregues por mês",
    description:
      "A automatização da EbookFy libera sua equipe para pensar no conteúdo, não no layout.",
  },
  {
    value: "100%",
    label: "profissional em cada exportação",
    description:
      "Capa, paginação e margens A4 prontas, com consistência visual em todo material.",
  },
];

const workflow = [
  {
    icon: PenSquare,
    title: "Centralize o conteúdo",
    description:
      "Cole o texto cru, suba imagens ou integre com sua fonte favorita. Tudo em minutos.",
    detail:
      "Editor inteligente com suporte a títulos, listas, citações e IA para refinar a narrativa.",
  },
  {
    icon: Clock,
    title: "Deixe a automação trabalhar",
    description:
      "Paginação automática em A4, capa pronta e distribuição equilibrada de imagens.",
    detail:
      "A EbookFy ajusta margens, fontes e espaçamento, garantindo visual consistente em qualquer impressão.",
  },
  {
    icon: FileText,
    title: "Exporte e compartilhe",
    description:
      "Baixe o PDF final sem marca d’água (para planos pagos) ou gere uma versão de demonstração.",
    detail:
      "Histórico de exportações salvo na nuvem, com rastreamento de uso por usuário e mês.",
  },
];

const migrationReasons = [
  "Tudo em um único fluxo: capa, conteúdo, imagens e exportação num só lugar.",
  "Controle de equipe: defina limites por plano e acompanhe o volume de PDFs gerados.",
  "Velocidade de produção: transforme roteiros brutos em ebooks prontos em minutos.",
  "Escalabilidade real: mantenha identidade visual em todas as campanhas, sem retrabalho.",
  "Integrações inteligentes: IA para lapidar conteúdo e upload simplificado para Supabase Storage.",
];

const promises = [
  {
    title: "Onboarding suave",
    description:
      "Traga seus modelos atuais e replique na EbookFy em uma tarde. Nossa equipe acompanha todo o processo.",
  },
  {
    title: "Operação previsível",
    description:
      "Sem arquivos espalhados ou formatações perdidas. Cada colaborador sabe onde está e o que fazer.",
  },
  {
    title: "Resultados mensuráveis",
    description:
      "Veja quantos ebooks foram exportados, por quem e em qual período. Dados para decisões reais.",
  },
];

const EbookfyLanding = () => {
  return (
    <div className="min-h-screen w-full bg-slate-950 text-white">
      <Seo
        title="EbookFy — Produza eBooks em minutos"
        description="Descubra como a EbookFy transforma roteiros em PDFs profissionais com capa, paginação automática e histórico de exportações."
        image="https://nolrnrwzeurbimcnjlwm.supabase.co/storage/v1/object/public/Luma__Fran/logo-1.jpg"
        url="https://ebookfy.pro/ebookfy"
        themeColor="#020617"
      />

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.15),transparent_55%)]" />
        <div className="container mx-auto px-6 py-24 relative z-10">
          <div className="max-w-3xl">
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-4 py-1 text-sm font-medium tracking-wide text-sky-200">
              <Sparkles className="mr-2 h-4 w-4" />
              Acelere a criação de ebooks agora
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
              EbookFy: sua operação de ebooks, 100% automatizada.
            </h1>
            <p className="mt-6 text-lg text-slate-300">
              Transforme conteúdos brutos em materiais profissionais com capa, paginação A4
              e visual consistente — em minutos, não em horas. Migre sua equipe de produção
              para um fluxo inteligente, colaborativo e rastreável.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button size="lg" className="h-12 px-8 text-base" asChild>
                <a href="/login">
                  Comece agora mesmo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 border-white/30 bg-transparent px-8 text-base text-white hover:bg-white/10"
                asChild
              >
                <a href="#como-funciona">Ver como funciona</a>
              </Button>
            </div>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {heroMetrics.map((metric) => (
              <Card
                key={metric.value}
                className="border-white/10 bg-white/5 text-left backdrop-blur"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-4xl font-bold text-sky-300">
                    {metric.value}
                  </CardTitle>
                  <p className="text-sm uppercase tracking-wide text-slate-200">
                    {metric.label}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-300">{metric.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section
        id="como-funciona"
        className="container mx-auto px-6 py-20 text-slate-100"
      >
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <h2 className="text-3xl font-semibold md:text-4xl">
              Veja como a EbookFy economiza horas do seu time
            </h2>
            <p className="mt-3 text-slate-300">
              Enquanto ferramentas tradicionais exigem malabarismo entre docs, designers e
              revisões, a EbookFy centraliza o fluxo em um ambiente que já entende o formato
              final: o PDF perfeito para impressão ou distribuição digital.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-200">
            <Zap className="h-4 w-4 text-amber-300" />
            Produção contínua, sem gargalos.
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {workflow.map((step) => (
            <Card
              key={step.title}
              className="border-white/10 bg-gradient-to-b from-white/10 to-white/5 text-left backdrop-blur"
            >
              <CardHeader className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10">
                  <step.icon className="h-6 w-6 text-sky-300" />
                </div>
                <CardTitle className="text-2xl text-white">{step.title}</CardTitle>
                <p className="text-sm text-slate-300">{step.description}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300">{step.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-slate-900/80">
        <div className="container mx-auto grid gap-10 px-6 py-20 md:grid-cols-[1.2fr_1fr]">
          <div>
            <h2 className="text-3xl font-semibold text-white md:text-4xl">
              Por que migrar toda a sua operação de ebooks para a EbookFy?
            </h2>
            <p className="mt-4 text-slate-300">
              Se você ainda empilha ferramentas ou depende de designers para cada material,
              está deixando tempo e margem na mesa. A EbookFy foi criada para quem precisa
              publicar rápido, com consistência e escala.
            </p>
            <ul className="mt-8 space-y-4 text-sm text-slate-200">
              {migrationReasons.map((reason) => (
                <li key={reason} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-300" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="flex items-center gap-3 text-slate-200">
              <Users className="h-5 w-5 text-sky-300" />
              <span className="text-sm uppercase tracking-wide">
                Migrações guiadas pela nossa equipe
              </span>
            </div>
            <h3 className="text-2xl font-semibold text-white">
              Trazemos sua biblioteca atual em 3 etapas
            </h3>
            <p className="text-sm text-slate-300">
              Fazemos um diagnóstico, montamos seus modelos na plataforma e treinamos o time
              para o novo fluxo. Tudo em até 7 dias.
            </p>
            <Button asChild className="w-full">
              <a href="/login">Quero migrar minha operação</a>
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 py-20 text-slate-100">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold md:text-4xl">
            EbookFy é para quem vive de entregar conteúdo
          </h2>
          <p className="mt-4 text-slate-300">
            Produtores digitais, agências, infoprodutores, times de marketing e qualquer
            equipe que precisa transformar ideias em materiais completos com velocidade.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {promises.map((promise) => (
            <Card
              key={promise.title}
              className="border-white/10 bg-white/5 text-left backdrop-blur"
            >
              <CardHeader>
                <CardTitle className="text-xl text-white">{promise.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300">{promise.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden px-6 py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-slate-950 to-slate-900" />
        <div className="container relative z-10 mx-auto rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1 text-sm text-sky-200">
            <Sparkles className="h-4 w-4" />
            O futuro dos seus ebooks começa agora
          </span>
          <h2 className="mt-6 text-4xl font-semibold text-white md:text-5xl">
            Pare de diagramar manualmente. Suba o nível da sua produção.
          </h2>
          <p className="mt-4 text-lg text-slate-200">
            A EbookFy elimina tarefas repetitivas, garante padrão profissional e entrega
            dados para você expandir com confiança. Acesse agora e veja por que equipes de
            conteúdo estão migrando para cá.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Button size="lg" className="h-12 px-8 text-base" asChild>
              <a href="/login">
                Criar minha conta gratuita
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 border-white/30 bg-transparent px-8 text-base text-white hover:bg-white/10"
              asChild
            >
              <a href="/upgrade">Conhecer planos pagos</a>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-slate-950 py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-6 text-center text-sm text-slate-400 md:flex-row md:text-left">
          <p>&copy; {new Date().getFullYear()} EbookFy. Todos os direitos reservados.</p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs uppercase tracking-wide text-slate-400 md:justify-end">
            <span>PDF em segundos</span>
            <span>Fluxo inteligente</span>
            <span>Operação escalável</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EbookfyLanding;