export const PAGE_WIDTH_MM = 210;
export const PAGE_HEIGHT_MM = 297;

// Padding base usado anteriormente (Tailwind p-8 = 32px)
export const PAGE_BASE_PADDING_PX = 32;

// Aumento de 100% nas margens para dar mais espaço interno
export const PAGE_PADDING_PX = PAGE_BASE_PADDING_PX * 2; // 64px

// Largura útil do conteúdo considerando padding em ambos os lados
export const PAGE_CONTENT_WIDTH_CALC = `calc(${PAGE_WIDTH_MM}mm - ${PAGE_PADDING_PX * 2}px)`;