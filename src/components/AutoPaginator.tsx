import React from "react";

type AutoPaginatorProps = {
  blocks: React.ReactNode[];
  pageContentMaxHeight?: number; // altura disponível para o conteúdo por página (px)
  renderPage: (children: React.ReactNode[], index: number) => React.ReactNode;
};

const DEFAULT_MAX_HEIGHT = 940; // ~A4 altura 1121px - paddings/rodapé

const AutoPaginator: React.FC<AutoPaginatorProps> = ({
  blocks,
  pageContentMaxHeight = DEFAULT_MAX_HEIGHT,
  renderPage,
}) => {
  const measureRef = React.useRef<HTMLDivElement | null>(null);
  const [pages, setPages] = React.useState<React.ReactNode[][]>([]);

  const paginate = React.useCallback(() => {
    const container = measureRef.current;
    if (!container) return;

    const childrenEls = Array.from(container.children) as HTMLElement[];
    const heights = childrenEls.map((el) => el.offsetHeight);

    const newPages: React.ReactNode[][] = [];
    let current: React.ReactNode[] = [];
    let acc = 0;

    heights.forEach((h, i) => {
      const block = blocks[i];
      if (acc + h > pageContentMaxHeight) {
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

  return (
    <>
      {pages.map((content, i) => (
        <React.Fragment key={i}>{renderPage(content, i)}</React.Fragment>
      ))}

      {/* Contêiner de medição oculto com a mesma largura/tipografia do conteúdo real */}
      <div
        ref={measureRef}
        className="absolute opacity-0 pointer-events-none -z-50 presentation-content"
        style={{
          visibility: "hidden",
          width: "calc(210mm - 64px)", // 210mm menos padding lateral (p-8 = 32px x 2)
        }}
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