export const PAGE_WIDTH_MM = 210;
export const PAGE_HEIGHT_MM = 297;

// Padding externo da página (mantém a logo próxima da borda como antes)
export const PAGE_BASE_PADDING_PX = 32;
export const PAGE_PADDING_PX = PAGE_BASE_PADDING_PX;

// Inset interno apenas para o texto (margens maiores do texto em relação às bordas A4)
export const CONTENT_INSET_PX = 48;

// Largura útil do conteúdo considerando padding externo + inset interno (ambos os lados)
export const PAGE_CONTENT_WIDTH_CALC = `calc(${PAGE_WIDTH_MM}mm - ${(PAGE_PADDING_PX + CONTENT_INSET_PX) * 2}px)`;