import React from "react";
import { CoverPage, CoverProps, ContentPage } from "./PDFTemplate";

export interface PDFData {
  cover: CoverProps;
  pages: React.ReactNode[];
  contentBackground?: string; // background total nas páginas internas
  footerLogo?: string;        // logo central no rodapé das páginas internas
  pageTopRightLogo?: string;  // logo no canto superior direito em todas as páginas internas
}

const PDFGenerator: React.FC<{ data: PDFData }> = ({ data }) => {
  const { cover, pages, contentBackground, footerLogo, pageTopRightLogo } = data;
  return (
    <>
      <CoverPage {...cover} />
      {pages.map((content, index) => (
        <ContentPage
          key={index}
          backgroundImage={contentBackground}
          footerLogo={footerLogo}
          topRightLogo={pageTopRightLogo}
        >
          {content}
        </ContentPage>
      ))}
    </>
  );
};

export default PDFGenerator;