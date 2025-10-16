import React from "react";

export interface CoverProps {
  background: string;
  logo: string;
  lessonNumber: string;
  topic: string;
  signatureTitle?: string;
  signatureSubtitle?: string;
}

function classNames(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(" ");
}

export const CoverPage: React.FC<CoverProps> = ({
  background,
  logo,
  lessonNumber,
  topic,
  signatureTitle,
  signatureSubtitle,
}) => {
  const safeBackground = background || "/placeholder.svg";
  const [showLogo, setShowLogo] = React.useState(true);

  return (
    <div
      className="page w-[210mm] h-[297mm] mx-auto relative flex items-center justify-center bg-white shadow-md print:shadow-none overflow-hidden"
      style={{
        backgroundImage: `url(${safeBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "#ffffff",
      }}
    >
      <div className="absolute inset-0 bg-white/35 pointer-events-none" />
      {showLogo && (
        <img
          src={logo || "/favicon.ico"}
          alt="Logo"
          className="absolute top-6 right-6 w-28 h-auto object-contain"
          onError={() => setShowLogo(false)}
        />
      )}
      <div className="relative px-8 text-center">
        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight text-gray-900">
          {lessonNumber}
        </h1>
        <h2 className="mt-4 text-4xl font-semibold text-gray-800">{topic}</h2>
      </div>
      {(signatureTitle || signatureSubtitle) && (
        <div className="absolute bottom-8 right-8 text-right">
          {signatureTitle && (
            <div className="text-2xl md:text-3xl font-bold tracking-wide text-gray-800">
              {signatureTitle}
            </div>
          )}
          {signatureSubtitle && (
            <div className="text-base md:text-lg text-gray-700 mt-1">
              {signatureSubtitle}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export interface ContentProps {
  children: React.ReactNode;
  className?: string;
  backgroundImage?: string;
  topRightLogo?: string;
}

export const ContentPage: React.FC<ContentProps> = ({
  children,
  className,
  backgroundImage,
  topRightLogo,
}) => {
  return (
    <div
      className={classNames(
        "page w-[210mm] h-[297mm] mx-auto p-8 bg-white shadow-md print:shadow-none relative overflow-hidden",
        className
      )}
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "#ffffff",
      }}
    >
      {topRightLogo && (
        <img
          src={topRightLogo}
          alt="Logo da página"
          className="absolute top-6 right-6 w-24 h-auto object-contain"
        />
      )}
      <div className="relative z-10 presentation-content">
        {children}
      </div>
    </div>
  );
};