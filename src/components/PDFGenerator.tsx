import React from "react";
import { CoverPage, CoverProps, ContentPage } from "./PDFTemplate";

export interface PDFData {
  cover: CoverProps;
  pages: React.ReactNode[];
  contentBackground?: string; // marca d'água nas páginas internas
  footerLogo?: string;        // logo central no rodapé das páginas internas
}

const PDFGenerator: React.FC<{ data: PDFData }> = ({ data }) => {
  const { cover, pages, contentBackground, footerLogo } = data;
  return (
    <>
      <CoverPage {...cover} />
      {pages.map((content, index) => (
        <ContentPage
          key={index}
          backgroundImage={contentBackground}
          footerLogo={footerLogo}
        >
          {content}
        </ContentPage>
      ))}
    </>
  );
};

export default PDFGenerator;