import React from "react";
import PDFGenerator, { PDFData } from "@/components/PDFGenerator";
import { MadeWithDyad } from "@/components/made-with-dyad";

const sampleData: PDFData = {
  cover: {
    background: "/background.png",
    logo: "/logo.png",
    lessonNumber: "Aula 1",
    topic: "Introdução ao Tema",
    author: "Nome da Autora",
    category: "Categoria de Aulas",
  },
  pages: [
    <>
      <h1 className="text-2xl font-bold mb-4">Resumo da Aula</h1>
      <p className="mb-2">
        Aqui vai o texto do resumo da aula. Você só precisa trocar este conteúdo
        pelo que quiser.
      </p>
      <p>
        Segundo parágrafo de exemplo para mostrar o estilo de página de conteúdo em A4.
      </p>
    </>,
    // Você pode adicionar quantas páginas quiser aqui, basta empurrar mais React nodes.
  ],
};

const Index = () => {
  return (
    <div className="space-y-8">
      <PDFGenerator data={sampleData} />
      <MadeWithDyad />
    </div>
  );
};

export default Index;