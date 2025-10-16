import React from "react";
import { PAGE_CONTENT_WIDTH_CALC, CONTENT_INSET_PX } from "@/constants/layout";

type AutoPaginatorProps = {
  blocks: React.ReactNode[];
  pageContentMaxHeight?: number; // altura disponível para o conteúdo por página (px)
  renderPage: (children: React.ReactNode[], index: number) => React.ReactNode;
  justifyText?: boolean;
  language?: string;
};

const DEFAULT_MAX_HEIGHT = 940; // ~A4 altura 1121px - paddings/rodapé

const AutoPaginator: React.FC<AutoPaginatorProps> = ({
  blocks,
  pageContentMaxHeight = DEFAULT_MAX_HEIGHT,
  renderPage,
  justifyText = true,
  language = "pt-BR",
}) => {
  const measureRef = React.useRef<HTMLDivElement | null>(null);
  const [pages, setPages] = React.useState<React.ReactNode[][]>([]);

  const paginate = React.useCallback(() => {
    const container = measureRef.current;
    if (!container) return;

    const childrenEls = Array.from(container.children) as HTMLElement[];
    const heights = childrenEls.map((el) => el.offsetHeight);

    // Considerar o inset vertical aplicado dentro da página
    const availableHeight = Math.max(0, pageContentMaxHeight - CONTENT_INSET_PX * 2);

    const newPages: React.ReactNode[][] = [];
    let current: React.ReactNode[] = [];
    let acc = 0;

    heights.forEach((h, i) => {
      const block = blocks[i];
      if (acc + h > availableHeight) {
        if (current.length) newPages.push(current);
        current = [block];
        acc = h;
      } else {
        current.push(block);
        acc += h;
      }
    });
    if (current.length) newPages.push(current);
    setPages(newPages);
  }, [blocks, pageContentMaxHeight]);

  React.useEffect(() => {
    paginate();
  }, [paginate]);

  React.useEffect(() => {
    const onResize = () => {
      paginate();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [paginate]);

  // Recalcular quando imagens terminarem de carregar dentro do contêiner de medição
  React.useEffect(() => {
    const container = measureRef.current;
    if (!container) return;

    const imgs = Array.from(container.querySelectorAll("img"));
    if (imgs.length === 0) return;

    let cancelled = false;
    const handle = () => {
      if (!cancelled) paginate();
    };

    imgs.forEach((img) => {
      if (img.complete) return;
      img.addEventListener("load", handle);
      img.addEventListener("error", handle);
    });

    // Fallback: garantir reflow após pequeno atraso
    const t = setTimeout(handle, 300);

    return () => {
      cancelled = true;
      clearTimeout(t);
      imgs.forEach((img) => {
        img.removeEventListener("load", handle);
        img.removeEventListener("error", handle);
      });
    };
  }, [blocks, paginate]);

  return (
    <>
      {pages.map((content, i) => (
        <React.Fragment key={i}>{renderPage(content, i)}</React.Fragment>
      ))}

      {/* Contêiner de medição oculto com a mesma largura/tipografia do conteúdo real */}
      <div
        ref={measureRef}
        className={`absolute opacity-0 pointer-events-none -z-50 presentation-content ${justifyText ? "justify-text" : ""}`}
        style={{
          visibility: "hidden",
          width: PAGE_CONTENT_WIDTH_CALC, // largura da caixa de texto efetiva
        }}
        lang={language}
      >
        {blocks.map((block, i) => (
          <div key={i} className="m-0 p-0">
            {block}
          </div>
        ))}
      </div>
    </>
  );
};

export default AutoPaginator;