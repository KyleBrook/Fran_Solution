import React from "react";
import { CoverPage, CoverProps, ContentPage } from "./PDFTemplate";
import AutoPaginator from "./AutoPaginator";

export interface PDFData {
  cover: CoverProps;
  pages?: React.ReactNode[];         // caminho antigo (páginas já divididas)
  blocks?: React.ReactNode[];        // novo caminho (paginação automática por blocos)
  contentBackground?: string;        // background total nas páginas internas
  footerLogo?: string;               // logo central no rodapé das páginas internas
  pageTopRightLogo?: string;         // logo no canto superior direito em todas as páginas internas
}

const PDFGenerator: React.FC<{ data: PDFData }> = ({ data }) => {
  const { cover, pages, blocks, contentBackground, footerLogo, pageTopRightLogo } = data;

  return (
    <>
      <CoverPage {...cover} />
      {Array.isArray(blocks) && blocks.length > 0 ? (
        <AutoPaginator
          blocks={blocks}
          renderPage={(children, index) => (
            <ContentPage
              key={index}
              backgroundImage={contentBackground}
              footerLogo={footerLogo}
              topRightLogo={pageTopRightLogo}
            >
              {children}
            </ContentPage>
          )}
        />
      ) : (
        (pages || []).map((content, index) => (
          <ContentPage
            key={index}
            backgroundImage={contentBackground}
            footerLogo={footerLogo}
            topRightLogo={pageTopRightLogo}
          >
            {content}
          </ContentPage>
        ))
      )}
    </>
  );
};

export default PDFGenerator;