import { supabase } from "@/integrations/supabase/client";

type UploadOptions = {
  bucket?: string;
  folder?: string;
};

function slugifyFilename(name: string) {
  const [base, ext] = (() => {
    const idx = name.lastIndexOf(".");
    if (idx === -1) return [name, ""];
    return [name.slice(0, idx), name.slice(idx)];
  })();
  const slugBase = base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `${slugBase}${ext.toLowerCase()}`;
}

/**
 * Faz upload de uma imagem para o Supabase Storage e retorna a URL pública.
 * Por padrão usa o bucket 'Luma__Fran' e pasta 'uploads'.
 */
export async function uploadImageToSupabase(
  file: File,
  opts: UploadOptions = {}
): Promise<string> {
  const bucket = opts.bucket ?? "Luma__Fran";
  const folder = opts.folder ?? "uploads";
  const filename = slugifyFilename(file.name || "imagem.png");
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${filename}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "image/png",
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Faz upload de um PDF para o Supabase Storage e retorna a URL pública.
 * Por padrão usa o bucket 'Luma__Fran' e pasta 'pdf_exports'.
 */
export async function uploadPdfToSupabase(
  file: File,
  opts: UploadOptions = {}
): Promise<string> {
  const bucket = opts.bucket ?? "Luma__Fran";
  const folder = opts.folder ?? "pdf_exports";
  const filename = slugifyFilename(file.name || "documento.pdf");
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${filename}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "0",
    upsert: false,
    contentType: file.type || "application/pdf",
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}