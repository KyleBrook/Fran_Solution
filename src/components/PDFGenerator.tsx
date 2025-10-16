import React from "react";
import { CoverPage, CoverProps, ContentPage } from "./PDFTemplate";
import AutoPaginator from "./AutoPaginator";

export interface PDFData {
  cover: CoverProps;
  pages?: React.ReactNode[];
  blocks?: React.ReactNode[];
  contentBackground?: string;
  pageTopRightLogo?: string;
  justifyText?: boolean;
  language?: string;
}

const PDFGenerator: React.FC<{ data: PDFData }> = ({ data }) => {
  const {
    cover,
    pages,
    blocks,
    contentBackground,
    pageTopRightLogo,
    justifyText = true,
    language = "pt-BR",
  } = data;

  return (
    <>
      <CoverPage {...cover} />
      {Array.isArray(blocks) && blocks.length > 0 ? (
        <AutoPaginator
          blocks={blocks}
          justifyText={justifyText}
          language={language}
          renderPage={(children, index) => (
            <ContentPage
              key={index}
              backgroundImage={contentBackground}
              topRightLogo={pageTopRightLogo}
              justifyText={justifyText}
              language={language}
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
            topRightLogo={pageTopRightLogo}
            justifyText={justifyText}
            language={language}
          >
            {content}
          </ContentPage>
        ))
      )}
    </>
  );
};

export default PDFGenerator;