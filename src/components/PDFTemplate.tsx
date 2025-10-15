import React from "react";

export interface CoverProps {
  background: string; // caminho no public, ex: '/background.png'
  logo: string;       // caminho no public, ex: '/logo.png'
  lessonNumber: string;
  topic: string;
  author: string;
  category: string;
}

export const CoverPage: React.FC<CoverProps> = ({
  background,
  logo,
  lessonNumber,
  topic,
  author,
  category,
}) => {
  return (
    <div
      className="page w-[210mm] h-[297mm] mx-auto flex flex-col justify-center items-center relative bg-white shadow-md print:shadow-none"
      style={{
        backgroundImage: `url(${background})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "#ffffff",
      }}
    >
      <img src={logo} alt="Logo" className="absolute top-4 right-4 w-16 h-16 object-contain" />
      <h1 className="text-4xl font-bold mb-2 text-gray-900">{lessonNumber}</h1>
      <h2 className="text-3xl mb-4 text-gray-800">{topic}</h2>
      <div className="absolute bottom-4 text-lg text-gray-700 px-6 text-center">
        {author} – {category}
      </div>
    </div>
  );
};

export interface ContentProps {
  children: React.ReactNode;
}

export const ContentPage: React.FC<ContentProps> = ({ children }) => {
  return (
    <div className="page w-[210mm] h-[297mm] mx-auto p-8 flex flex-col relative bg-white shadow-md print:shadow-none">
      {children}
    </div>
  );
};