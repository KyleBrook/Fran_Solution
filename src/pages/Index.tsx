import React from "react";
import { CoverPage, ContentPage } from "@/components/PDFTemplate";
import { MadeWithDyad } from "@/components/made-with-dyad";

const Index = () => {
  return (
    <div className="space-y-8">
      {/* Exemplo de capa */}
      <CoverPage
        background="/background.png"
        logo="/logo.png"
        lessonNumber="Aula 1"
        topic="Introdução ao Tema"
        author="Nome da Autora"
        category="Categoria de Aulas"
      />

      {/* Exemplo de página de conteúdo */}
      <ContentPage>
        <h1 className="text-2xl font-bold mb-4">Resumo da Aula</h1>
        <p className="mb-2">
          Aqui vai o texto do resumo da aula. Você pode passar qualquer conteúdo
          via children.
        </p>
        <p>
          Segundo parágrafo de exemplo para mostrar o estilo de página de
          conteúdo em A4.
        </p>
      </ContentPage>

      <MadeWithDyad />
    </div>
  );
};

export default Index;