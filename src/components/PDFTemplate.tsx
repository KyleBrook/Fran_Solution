import React from "react";

export interface CoverProps {
  background: string; // ex.: '/capa-bg.png' ou URL
  logo: string;       // ex.: '/logo-edd.png' ou URL
  lessonNumber: string; // "M3 | Aula 06"
  topic: string;        // "Origem das Nações"
  signatureTitle?: string;    // "GÊNESIS , O INÍCIO DE TUDO."
  signatureSubtitle?: string; // "COM LUMA ELPIDIO"
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
      {/* Overlay sutil para legibilidade */}
      <div className="absolute inset-0 bg-white/35 pointer-events-none" />

      {/* Logo no topo direito */}
      {showLogo && (
        <img
          src={logo || "/favicon.ico"}
          alt="Logo"
          className="absolute top-6 right-6 w-28 h-auto object-contain"
          onError={() => setShowLogo(false)}
        />
      )}

      {/* Título central */}
      <div className="relative px-8 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900">
          {lessonNumber}
        </h1>
        <h2 className="mt-3 text-3xl font-semibold text-gray-800">{topic}</h2>
      </div>

      {/* Assinatura canto inferior direito (texto) */}
      {(signatureTitle || signatureSubtitle) && (
        <div className="absolute bottom-8 right-8 text-right">
          {signatureTitle && (
            <div className="text-sm tracking-wide text-gray-700">
              {signatureTitle}
            </div>
          )}
          {signatureSubtitle && (
            <div className="text-xs text-gray-600">{signatureSubtitle}</div>
          )}
        </div>
      )}
    </div>
  );
};

export interface ContentProps {
  children: React.ReactNode;
  className?: string;
  backgroundImage?: string; // background total nas páginas internas
  footerLogo?: string;      // logo central no rodapé (todas as páginas de conteúdo)
  topRightLogo?: string;    // logo no canto superior direito (todas as páginas de conteúdo)
}

export const ContentPage: React.FC<ContentProps> = ({
  children,
  className,
  backgroundImage,
  footerLogo,
  topRightLogo,
}) => {
  return (
    <div
      className={classNames(
        "page w-[210mm] h-[297mm] mx-auto p-10 bg-white shadow-md print:shadow-none relative overflow-hidden",
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
      {/* Logo no topo direito nas páginas internas */}
      {topRightLogo && (
        <img
          src={topRightLogo}
          alt="Logo da página"
          className="absolute top-6 right-6 w-24 h-auto object-contain"
        />
      )}

      {/* Conteúdo */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Logo central no rodapé */}
      {footerLogo && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
          <img
            src={footerLogo}
            alt="Assinatura"
            className="w-36 h-auto object-contain opacity-90"
          />
        </div>
      )}
    </div>
  );
};