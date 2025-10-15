import React from "react";
import { CoverPage, CoverProps, ContentPage } from "./PDFTemplate";

export interface PDFData {
  cover: CoverProps;
  pages: React.ReactNode[];
}

const PDFGenerator: React.FC<{ data: PDFData }> = ({ data }) => {
  const { cover, pages } = data;
  return (
    <>
      <CoverPage {...cover} />
      {pages.map((content, index) => (
        <ContentPage key={index}>{content}</ContentPage>
      ))}
    </>
  );
};

export default PDFGenerator;