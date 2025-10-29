import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Seo from "@/components/Seo";
import Scroll3DScene from "@/components/Scroll3DScene";
import ScrollTiltCard from "@/components/ScrollTiltCard";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  PenSquare,
  Quote,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

const heroMetrics = [
  {
    value: "80%",
    label: "menos tempo com formatações",
    description:
      "Recupere centenas de horas por mês e elimine revisões intermináveis de layout.",
  },
  {
    value: "10x",
    label: "mais ebooks entregues por mês",
    description:
      "Escale sua produção sem contratar mais gente; seu time foca no conteúdo.",
  },
  {
    value: "100%",
    label: "profissional em cada exportação",
    description:
      "Capa, margens A4 e paginação automática garantem consistência visual da sua marca.",
  },
];

const workflowSteps = [
  {
    icon: PenSquare,
    title: "Cole e organize",
    description:
      "Cole seu texto, arraste as imagens e use o editor inteligente.",
    detail: "A IA ajuda a refinar tom, títulos e estrutura em segundos.",
  },
  {
    icon: Clock,
    title: "A mágica acontece automaticamente",
    description:
      "A EbookFy cuida da capa, margens A4 e distribuição equilibrada de imagens.",
    detail: "Visual consistente e alinhado com a identidade da sua marca.",
  },
  {
    icon: FileText,
    title: "Exporte e compartilhe",
    description:
      "Baixe o PDF pronto em poucos cliques, sem marca d’água nos planos pagos.",
    detail: "Histórico salvo na nuvem e métricas de uso por membro da equipe.",
  },
];

const clientLogos = [
  "Impacto Digital",
  "Escola Nova Voz",
  "Agência 7X",
  "Comunidade Inspire",
  "Rede ProConteúdo",
];

const testimonials = [
  {
    quote:
      "Reduzimos de dois dias para poucas horas o tempo entre roteiros e PDFs prontos. A equipe voltou a focar em estratégia.",
    name: "Ana Martins",
    role: "Gerente de Conteúdo",
    company: "Agência Elevate",
  },
  {
    quote:
      "Nosso time de educação corporativa ganhou previsibilidade. Cada eBook sai com a mesma cara, sem depender de design.",
    name: "Diego Faria",
    role: "Head de Treinamentos",
    company: "Incompany Hub",
  },
  {
    quote:
      "A geração automática nos permitiu lançar 10 novos materiais em um mês. A consistência da marca nunca esteve melhor.",
    name: "Luiza Prado",
    role: "CMO",
    company: "Comunidade Viva",
  },
];

const trustSignals = [
  {
    Icon: ShieldCheck,
    title: "Infraestrutura segura",
    description: "Autenticação e armazenamento via Supabase.",
  },
  {
    Icon: CreditCard,
    title: "Pagamentos protegidos",
    description: "Checkouts e billing operados com Stripe.",
  },
  {
    Icon: Sparkles,
    title: "IA integrada",
    description: "Assistente embutido para ajustar tom e narrativa a cada material.",
  },
];

const audienceBenefits = [
  {
    title: "Tudo em um só fluxo",
    description:
      "Fim da bagunça de arquivos. Do conteúdo cru à capa final, 100% integrado.",
  },
  {
    title: "Controle total",
    description:
      "Defina limites por membro da equipe e acompanhe métricas de produção em tempo real.",
  },
  {
    title: "Velocidade de entrega",
    description:
      "Transforme roteiros brutos em ebooks prontos em minutos, não em dias.",
  },
  {
    title: "Identidade visual consistente",
    description:
      "Modelos prontos com margens, tipografia e capa alinhados à sua marca.",
  },
  {
    title: "Integrações inteligentes",
    description:
      "Use IA para lapidar textos e conecte com as ferramentas que você já utiliza.",
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
        <div className="container relative z-10 mx-auto px-6 py-24">
          <div className="grid gap-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="max-w-3xl">
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-4 py-1 text-sm font-medium tracking-wide text-sky-200">
                <Sparkles className="mr-2 h-4 w-4" />
                EbookFy para equipes que produzem em escala
              </span>
              <h1 className="mt-6 text-balance text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
                Pare de perder horas com formatação. Crie ebooks profissionais em minutos.
              </h1>
              <p className="mt-6 text-balance text-lg text-slate-300">
                A EbookFy automatiza a diagramação, do texto bruto ao PDF perfeito. Garanta
                consistência visual, recupere o tempo da sua equipe e escale sua produção de conteúdo.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Button size="lg" className="h-12 px-8 text-base" asChild>
                  <a href="/login">
                    Criar meu primeiro ebook
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 border-white/30 bg-transparent px-8 text-base text-white hover:bg-white/10"
                  asChild
                >
                  <a href="/upgrade">Ver planos e preços</a>
                </Button>
              </div>
            </div>
            <Scroll3DScene />
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {heroMetrics.map((metric) => (
              <ScrollTiltCard key={metric.value} intensity={10} className="rounded-3xl">
                <Card className="h-full rounded-3xl border-white/10 bg-white/5 text-left backdrop-blur">
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
              </ScrollTiltCard>
            ))}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="container mx-auto px-6 py-20 text-slate-100">
        <div className="mb-12 space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-white md:text-3xl">
            Cansado da bagunça na criação de ebooks?
          </h2>
          <p className="text-sm text-slate-200 md:text-base">
            Ferramentas desconexas, arquivos espalhados e dependência de designers atrasam lançamentos,
            aumentam custos e drenam a energia do time. A EbookFy coloca tudo em um só fluxo.
          </p>
        </div>

        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <h3 className="text-3xl font-semibold md:text-4xl">
              Veja como simplificamos a sua operação
            </h3>
            <p className="mt-3 text-slate-300">
              Em três passos, você transforma qualquer roteiro em um ebook completo, com consistência visual e controle total.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-200">
            <Zap className="h-4 w-4 text-amber-300" />
            Fluxo otimizado do conteúdo à exportação.
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {workflowSteps.map((step) => (
            <ScrollTiltCard key={step.title} intensity={9} className="rounded-3xl">
              <Card className="h-full rounded-3xl border-white/10 bg-gradient-to-b from-white/10 to-white/5 text-left backdrop-blur">
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
            </ScrollTiltCard>
          ))}
        </div>
      </section>

      <section className="bg-slate-900/60">
        <div className="container mx-auto space-y-10 px-6 py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold md:text-4xl">
              Equipes que produzem em escala confiam na EbookFy
            </h2>
            <p className="mt-4 text-slate-300">
              Seja lançando materiais semanais ou bibliotecas inteiras de conteúdo, nossos clientes recuperam tempo e mantêm a qualidade.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {clientLogos.map((logo) => (
              <div
                key={logo}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-200"
              >
                {logo}
              </div>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <ScrollTiltCard key={testimonial.name} intensity={8} className="rounded-3xl">
                <Card className="h-full rounded-3xl border-white/10 bg-white/5 text-left backdrop-blur">
                  <CardContent className="space-y-4 p-6">
                    <Quote className="h-8 w-8 text-sky-300" />
                    <p className="text-sm text-slate-200">“{testimonial.quote}”</p>
                    <div>
                      <p className="font-semibold text-white">{testimonial.name}</p>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        {testimonial.role} · {testimonial.company}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </ScrollTiltCard>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 rounded-3xl border border-white/10 bg-white/5 px-6 py-5">
            {trustSignals.map((signal) => {
              const Icon = signal.Icon;
              return (
                <div key={signal.title} className="flex max-w-xs items-start gap-3 text-left text-slate-200">
                  <div className="mt-1 rounded-full bg-sky-400/10 p-2 text-sky-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{signal.title}</p>
                    <p className="text-xs text-slate-300">{signal.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-slate-950">
        <div className="container mx-auto grid gap-10 px-6 py-20 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div>
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-4 py-1 text-xs uppercase tracking-wide text-slate-200">
              Produtores digitais, agências, escolas e equipes de marketing
            </span>
            <h2 className="mt-6 text-balance text-3xl font-semibold text-white md:text-4xl">
              Feito para escalar sua produção de conteúdo
            </h2>
            <p className="mt-4 text-slate-300">
              A EbookFy elimina gargalos e devolve previsibilidade ao seu time. Construa materiais impecáveis com autonomia, mantendo os ativos da marca sob controle.
            </p>
            <ul className="mt-8 space-y-4">
              {audienceBenefits.map((benefit) => (
                <li key={benefit.title} className="flex gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 flex-shrink-0 text-emerald-300" />
                  <div>
                    <p className="text-sm font-semibold text-white">{benefit.title}</p>
                    <p className="text-sm text-slate-300">{benefit.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <ScrollTiltCard intensity={8} className="rounded-3xl">
            <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur md:p-8">
              <div className="flex items-center gap-3 text-slate-200">
                <Users className="h-5 w-5 text-sky-300" />
                <span className="text-sm uppercase tracking-wide">
                  Migração guiada sem fricção
                </span>
              </div>
              <h3 className="text-2xl font-semibold text-white">Traga sua operação em 3 passos</h3>
              <p className="text-sm text-slate-300">
                Diagnosticamos seus modelos atuais, configuramos tudo na plataforma e treinamos o time para o novo fluxo — tudo em até 7 dias.
              </p>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                <p>
                  <strong className="text-white">Passo 1:</strong> mapeamos seus materiais.
                </p>
                <p className="mt-2">
                  <strong className="text-white">Passo 2:</strong> configuramos templates, fluxos e permissões.
                </p>
                <p className="mt-2">
                  <strong className="text-white">Passo 3:</strong> time treinado, produção em escala.
                </p>
              </div>
              <p className="text-xs text-slate-400">
                Precisa de algo sob medida? Nosso time ajuda a personalizar integrações e automações.
              </p>
            </div>
          </ScrollTiltCard>
        </div>
      </section>

      <section className="relative overflow-hidden px-6 py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-slate-950 to-slate-900" />
        <ScrollTiltCard
          intensity={7}
          className="container relative z-10 mx-auto rounded-3xl"
          glare={false}
          scale={1.02}
        >
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1 text-sm text-sky-200">
              <Sparkles className="h-4 w-4" />
              O futuro dos seus ebooks começa agora
            </span>
            <h2 className="mt-6 text-balance text-4xl font-semibold text-white md:text-5xl">
              Está pronto para transformar a criação de ebooks na sua empresa?
            </h2>
            <p className="mt-4 text-balance text-lg text-slate-200">
              Junte-se à EbookFy e ganhe escala, tempo e qualidade profissional. Automatize o que é repetitivo e coloque sua equipe para criar conteúdo que gera resultado.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Button size="lg" className="h-12 px-8 text-base" asChild>
                <a href="/login">
                  Experimentar grátis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 border-white/30 bg-transparent px-8 text-base text-white hover:bg-white/10"
                asChild
              >
                <a href="mailto:contato@ebookfy.pro">Falar com um especialista</a>
              </Button>
            </div>
          </div>
        </ScrollTiltCard>
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