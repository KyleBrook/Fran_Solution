import React from "react";
import PDFGenerator, { PDFData } from "@/components/PDFGenerator";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import ExportPDFButton from "@/components/ExportPDFButton";

const blocks: React.ReactNode[] = [
  <h1 key="t1">Aula 6 - Origem das Nações</h1>,
  <p key="p1">
    “Então o Senhor Deus disse: — Eis que o homem se tornou como um de nós,
    conhecedor do bem e do mal. É preciso impedir que estenda a mão, tome
    também da árvore da vida, coma e viva eternamente. Por isso o Senhor
    Deus o lançou fora do jardim do Éden, para cultivar a terra da qual havia
    sido tomado. E, depois de lançar fora o homem, Deus colocou querubins a
    leste do jardim do Éden e uma espada flamejante que se movia em todas as
    direções, para guardar o caminho da árvore da vida.” <span className="not-italic">(Gênesis 3:22-24)</span>
  </p>,
  <p key="p2">
    De fato, expulsar o homem do Éden foi um ato da misericórdia de Deus, e não de Sua punição.
    Como afirma-nos o versículo 22, o Todo-poderoso assim procedeu para evitar que a humanidade
    comesse da árvore da vida e, consequentemente, vivesse eternamente em imoralidade.
  </p>,
  <p key="p3">
    Portanto, se Adão e Eva comessem da árvore da vida, eles viveriam eternamente em seu estado
    pecaminoso. Isso significaria uma eternidade separados de Deus, em pecado e corrupção, algo
    muito pior que a morte física.
  </p>,
  <p key="p4">
    A expulsão do Éden foi, então, um ato de misericórdia, pois impediu que a humanidade ficasse
    para sempre num estado de rebelião, separados da presença de Deus.
  </p>,

  <h2 key="t2">POR QUE NÃO SE PODIA COMER DA ÁRVORE DO CONHECIMENTO DO BEM E DO MAL?</h2>,
  <p key="p5">
    Porque representava a quebra da dependência e da confiança exclusiva no Pai, representava a
    busca do homem em ser independente de Deus, por achar que poderia saber melhor do que o próprio Deus.
  </p>,

  <h2 key="t3">O JARDIM DO ÉDEN COMO SANTUÁRIO</h2>,
  <p key="p6">
    Em Gênesis 2-3, o jardim do Éden funciona como o local de encontro entre o Senhor Deus e o
    primeiro casal humano. Há paralelos interessantes entre o Éden e os santuários posteriores,
    particularmente o tabernáculo e o templo de Jerusalém, vamos ver algumas dessas semelhanças:
  </p>,
  <ol key="ol1">
    <li>
      O Senhor Deus caminha por entre o Éden da mesma maneira em
      que o faz mais tarde, no tabernáculo (Gn 3:8; Lv 26:12; Dt 23:15; 2Sm 7:6-7).
    </li>
    <li>
      Tanto no Éden quanto nos santuários posteriores, entra-se pelo
      lado oriental, e ambos são guardados por querubins (Gn 3:24; Ex
      25:18-22; 26:31; 1Rs 6:27-29).
    </li>
    <li>
      A menorá (ou candelabro) do tabernáculo possivelmente
      representa a árvore da vida (Gn 2:9, 3:22; Êx 25:31-35).
    </li>
    <li>
      O par de palavras hebraicas na ordem divina ao homem para
      cultivar e guardar (o jardim) (Gn 2:15) só é usado em combinação
      novamente no Pentateuco em referência aos deveres dos levitas no
      santuário (Nm 3:7-8; 8:26; 18:5-6).
    </li>
    <li>
      O rio que flui do Éden (Gn 2:10) lembra Ezequiel 47:1-12, em que se
      vislumbra um rio fluindo do templo futuro em Jerusalém e levando
      vida ao mar Morto. Por fim, o ouro e ônix mencionados em Gênesis
      2:11-12 são usados extensivamente para decorar santuários e vestes
      sacerdotais posteriores (Êx 25:7,11,17,31). O ouro, em particular, é
      associado à presença divina.
    </li>
  </ol>,
  <p key="p7">
    Já que o Éden é um paraíso em que a divindade e a humanidade
    gozam da companhia um do outro, é pouco surpreendente que
    ele se torne o protótipo dos santuários posteriores.
  </p>,
  <p key="p8">
    Embora os seres humanos desfrutem comunhão íntima com Deus
    no tabernáculo e no templo de Jerusalém, o acesso direto à
    presença imediata de Deus é limitado a uma vez por ano, e ainda
    assim apenas ao sumo sacerdote. Todavia, no Éden o primeiro
    homem e a primeira mulher têm o privilégio único de relacionar-
    se face a face com Deus, sem medo ou vergonha. Em contraste
    com esse histórico, o relato da desobediência é bem mais trágico.
  </p>,

  <h2 key="t4">O PRIMEIRO SACRIFÍCIO</h2>,
  <p key="p9">
    “Então os olhos de ambos se abriram; e, percebendo que estavam nus,
    costuraram folhas de figueira e fizeram cintas para si.”
    <span className="not-italic"> (Gênesis 3:7)</span>
  </p>,
  <p key="p10">
    Para, como o escritor do Livro de Hebreus diz: "Sem
    derramamento de sangue não há remissão [do pecado]" (Heb.
    9:22).
  </p>,
  <p key="p11">
    “Pois o salário do pecado é a morte” (Romanos 6:23)
  </p>,
  <p key="p12">
    Gn 3.21: E fez o SENHOR Deus a Adão e a sua mulher túnicas de
    peles e os vestiu. Ao fazer vestes de pele, Deus graciosamente
    providenciou para a necessidade humana de um modo superior àquele
    que Adão e Eva tinham feito com folhas de figueira.
  </p>,
  <p key="p13">
    O uso de peles de animais antecipa o sistema do AT de sacrifícios
    de animais (Lv 1:3-7; Nm 15:1-31).
  </p>,
  <p key="p14">
    No NT, Paulo falou de um dia quando Deus revestiria Seu povo de
    imortalidade (1 Co 15:53-54; 2 Co 5:4; Efésios 4:24), provendo
    assim a completa anulação da maldição do pecado da
    humanidade.
  </p>,
];

const sampleData: PDFData = {
  cover: {
    background: "https://nolrnrwzeurbimcnjlwm.supabase.co/storage/v1/object/public/Luma__Fran/Background.png",
    logo: "https://nolrnrwzeurbimcnjlwm.supabase.co/storage/v1/object/public/Luma__Fran/Logo%20EDD.PNG",
    lessonNumber: "M3 | Aula 06",
    topic: "Origem das Nações",
    signatureTitle: "GÊNESIS , O INÍCIO DE TUDO.",
    signatureSubtitle: "COM LUMA ELPIDIO",
  },
  contentBackground: "https://nolrnrwzeurbimcnjlwm.supabase.co/storage/v1/object/public/Luma__Fran/fundo%20imagens%20luma.png",
  pageTopRightLogo: "https://nolrnrwzeurbimcnjlwm.supabase.co/storage/v1/object/public/Luma__Fran/Logo%20EDD.PNG",
  blocks,
};

const Index = () => {
  return (
    <div className="min-h-screen w-full bg-white py-8">
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          <Button asChild>
            <Link to="/criar-pdf">Criar PDF personalizado</Link>
          </Button>
          <ExportPDFButton filename="aula-06.pdf" />
        </div>
        <PDFGenerator data={sampleData} />
      </div>
    </div>
  );
};

export default Index;