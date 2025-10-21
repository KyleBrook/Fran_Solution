import React from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import PDFGenerator, { PDFData } from "@/components/PDFGenerator"
import {
  showError,
  showLoading,
  showSuccess,
  dismissToast,
} from "@/utils/toast"
import { supabase } from "@/integrations/supabase/client"
import ExportPDFButton from "@/components/ExportPDFButton"
import ImageBlock from "@/components/ImageBlock"
import { uploadImageToSupabase } from "@/integrations/supabase/storage"
import { UploadCloud } from "lucide-react"
import Seo from "@/components/Seo"
import { useEntitlements } from "@/features/subscription/useEntitlements"

type ImageItem = {
  src: string
  caption?: string
  width: number // percent
  afterParagraph: number // 0..N (0 = antes do 1º parágrafo, N = após o último)
}

const sizeOptionsTitle = [40, 48, 56, 64, 72, 80]
const sizeOptionsSubtitle = [20, 22, 24, 28, 32, 36]
const sizeOptionsBody = [16, 18, 20, 22, 24, 26]
const sizeOptionsH2 = [20, 22, 24, 26, 28, 32]
const sizeOptionsH3 = [16, 18, 20, 22, 24, 26]
const widthOptions = [40, 50, 60, 70, 80, 90, 100]

const DEFAULTS = {
  coverBackground:
    "https://nolrnrwzeurbimcnjlwm.supabase.co/storage/v1/object/public/Luma__Fran/Background.png",
  logo:
    "https://nolrnrwzeurbimcnjlwm.supabase.co/storage/v1/object/public/Luma__Fran/Logo%20EDD.PNG",
  contentBackground:
    "https://nolrnrwzeurbimcnjlwm.supabase.co/storage/v1/object/public/Luma__Fran/fundo%20imagens%20luma.png",
  pageTopRightLogo:
    "https://nolrnrwzeurbimcnjlwm.supabase.co/storage/v1/object/public/Luma__Fran/Logo%20EDD.PNG",
}

export default function CreatePDF() {
  const [title, setTitle] = React.useState("Meu Título")
  const [subtitle, setSubtitle] = React.useState("Meu Subtítulo")
  const [signatureTitle, setSignatureTitle] = React.useState("")
  const [signatureSubtitle, setSignatureSubtitle] = React.useState("")
  const [body, setBody] = React.useState(
    "Cole seu texto aqui.\n\nSepare parágrafos com linha em branco.\n\n## Exemplo de Seção\n\n### Exemplo de Sub-seção\n\nTexto do parágrafo após os subtítulos."
  )
  const [suggestions, setSuggestions] = React.useState("")
  const [titleSize, setTitleSize] = React.useState(64)
  const [subtitleSize, setSubtitleSize] = React.useState(28)
  const [bodySize, setBodySize] = React.useState(20)
  const [h2Size, setH2Size] = React.useState(24)
  const [h3Size, setH3Size] = React.useState(20)
  const [justifyText, setJustifyText] = React.useState(true)
  const [loadingAI, setLoadingAI] = React.useState(false)
  const [generated, setGenerated] = React.useState<PDFData | null>(null)

  // Imagens
  const [images, setImages] = React.useState<ImageItem[]>([])
  const [imgUrl, setImgUrl] = React.useState("")
  const [imgCaption, setImgCaption] = React.useState("")
  const [imgWidth, setImgWidth] = React.useState(80)
  const [imgAfterPara, setImgAfterPara] = React.useState(0)
  const [uploading, setUploading] = React.useState(false)

  const { aiEnabled } = useEntitlements()

  // Conta apenas parágrafos (linhas que não são cabeçalhos ##/###)
  const paragraphs = React.useMemo(() => {
    return body
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)
      .filter((p) => !/^#{2,3}\s+/.test(p))
  }, [body])

  function composeBlocks(
    t: string,
    s: string,
    paras: string[],
    sizes: { t: number; s: number; b: number; h2: number; h3: number },
    imgs: ImageItem[],
    rawBody?: string
  ) {
    const items: React.ReactNode[] = []

    if (t.trim()) items.push(<h1 key="title" style={{ fontSize: sizes.t }}>{t}</h1>)
    if (s.trim()) items.push(<h2 key="subtitle" style={{ fontSize: sizes.s }}>{s}</h2>)

    // imagens com afterParagraph === 0 (antes do primeiro parágrafo)
    imgs
      .filter((im) => im.afterParagraph === 0)
      .forEach((im, idx) => {
        items.push(
          <ImageBlock
            key={"img-0-" + idx + "-" + im.src}
            src={im.src}
            caption={im.caption}
            widthPercent={im.width}
            align="center"
          />
        )
      })

    if (rawBody) {
      const segments = rawBody
        .split(/\n\s*\n/)
        .map((seg) => seg.trim())
        .filter(Boolean)

      let paraIndex = 0
      segments.forEach((seg, idx) => {
        const h3Match = seg.match(/^###\s+(.+)/)
        const h2Match = seg.match(/^##\s+(.+)/)

        if (h3Match) {
          items.push(
            <h3 key={"h3-" + idx} style={{ fontSize: sizes.h3 }}>
              {h3Match[1]}
            </h3>
          )
          return
        }
        if (h2Match) {
          items.push(
            <h2 key={"h2-" + idx} style={{ fontSize: sizes.h2 }}>
              {h2Match[1]}
            </h2>
          )
          return
        }

        items.push(
          <p key={"p-" + idx} style={{ fontSize: sizes.b }}>
            {seg}
          </p>
        )
        paraIndex += 1

        imgs
          .filter((im) => im.afterParagraph === paraIndex)
          .forEach((im, i2) => {
            items.push(
              <ImageBlock
                key={"img-" + paraIndex + "-" + i2 + "-" + im.src}
                src={im.src}
                caption={im.caption}
                widthPercent={im.width}
                align="center"
              />
            )
          })
      })

      if (segments.length === 0 && imgs.length === 0) {
        items.push(
          <p key="empty" style={{ fontSize: sizes.b }}>
            Adicione seu texto.
          </p>
        )
      }
      return items
    }

    paras.forEach((p, i) => {
      items.push(
        <p key={"p-" + i} style={{ fontSize: sizes.b }}>
          {p}
        </p>
      )

      imgs
        .filter((im) => im.afterParagraph === i + 1)
        .forEach((im, idx) => {
          items.push(
            <ImageBlock
              key={"img-" + (i + 1) + "-" + idx + "-" + im.src}
              src={im.src}
              caption={im.caption}
              widthPercent={im.width}
              align="center"
            />
          )
        })
    })

    if (paras.length === 0 && imgs.length === 0) {
      items.push(
        <p key="empty" style={{ fontSize: sizes.b }}>
          Adicione seu texto.
        </p>
      )
    }

    return items
  }

  const blocks = React.useMemo<React.ReactNode[]>(() => {
    return composeBlocks(
      title,
      subtitle,
      paragraphs,
      { t: titleSize, s: subtitleSize, b: bodySize, h2: h2Size, h3: h3Size },
      images,
      body
    )
  }, [title, subtitle, paragraphs, titleSize, subtitleSize, bodySize, h2Size, h3Size, images, body])

  function buildPDFData(fromBlocks: React.ReactNode[]) {
    return {
      cover: {
        background: DEFAULTS.coverBackground,
        logo: DEFAULTS.logo,
        lessonNumber: title || " ",
        topic: subtitle || " ",
        signatureTitle: signatureTitle || undefined,
        signatureSubtitle: signatureSubtitle || undefined,
      },
      contentBackground: DEFAULTS.contentBackground,
      pageTopRightLogo: DEFAULTS.pageTopRightLogo,
      blocks: fromBlocks,
      justifyText,
      language: "pt-BR",
    } as PDFData
  }

  const handleGenerate = () => {
    setGenerated(buildPDFData(blocks))
    showSuccess("PDF gerado!")
  }

  const handlePrint = () => {
    if (!generated) return
    window.print()
  }

  const handleGenerateWithAI = async () => {
    if (!aiEnabled) {
      showError("A IA está disponível nos planos Basic e Pro. Faça o upgrade para usar.");
      return;
    }
    if (loadingAI) return
    setLoadingAI(true)
    const toastId = showLoading("Gerando com IA...")
    try {
      const { data, error } = await supabase.functions.invoke<{
        title: string
        subtitle: string
        paragraphs: string[]
      }>("gpt-pdf-helper", {
        body: JSON.stringify({ title, subtitle, body, language: "pt-BR", suggestions }),
      })
      if (error) throw error
      const aiTitle = (data as any)?.title || title
      const aiSubtitle = (data as any)?.subtitle || subtitle
      const paras = Array.isArray((data as any)?.paragraphs) ? (data as any)?.paragraphs : []
      setTitle(aiTitle)
      setSubtitle(aiSubtitle)
      setBody(paras.join("\n\n"))

      const aiBlocks = composeBlocks(
        aiTitle,
        aiSubtitle,
        paras,
        { t: titleSize, s: subtitleSize, b: bodySize, h2: h2Size, h3: h3Size },
        images
      )
      setGenerated(buildPDFData(aiBlocks))
      showSuccess("Conteúdo IA aplicado")
    } catch (err) {
      console.error(err)
      showError("Falha ao gerar com IA.")
    } finally {
      dismissToast(toastId)
      setLoadingAI(false)
    }
  }

  const exportFilename = React.useMemo(() => {
    const base = [title, subtitle].filter(Boolean).join(" - ") || "documento"
    return base.replace(/\s+/g, "_").toLowerCase() + ".pdf"
  }, [title, subtitle])

  const handleAddImage = () => {
    if (!imgUrl.trim()) {
      showError("Informe a URL da imagem.")
      return
    }
    const pos = Math.max(0, Math.min(paragraphs.length, imgAfterPara))
    const newItem: ImageItem = {
      src: imgUrl.trim(),
      caption: imgCaption.trim() || undefined,
      width: imgWidth,
      afterParagraph: pos,
    }
    setImages((prev) => [...prev, newItem])
    setImgUrl("")
    setImgCaption("")
    setImgWidth(80)
    setImgAfterPara(0)
    showSuccess("Imagem adicionada!")
  }

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
    showSuccess("Imagem removida.")
  }

  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const toastId = showLoading("Enviando imagem para o Supabase...")
    try {
      const publicUrl = await uploadImageToSupabase(file, {
        bucket: "Luma__Fran",
        folder: "uploads",
      })
      setImgUrl(publicUrl)
      showSuccess("Imagem enviada! URL preenchida automaticamente.")
    } catch (err) {
      console.error(err)
      showError("Falha ao enviar imagem. Verifique o bucket e as permissões.")
    } finally {
      dismissToast(toastId)
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Seo
        title="EbookFy - Ebook em Segundos"
        description="Ebook em Segundos."
        image="https://nolrnrwzeurbimcnjlwm.supabase.co/storage/v1/object/public/Luma__Fran/logo-1.jpg"
        url="https://ebookfy.pro"
      />
      <div className="container mx-auto">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Gerar PDF Personalizado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border bg-white p-3 text-xs text-muted-foreground">
              {aiEnabled ? (
                <span>IA disponível no seu plano.</span>
              ) : (
                <span>
                  IA indisponível no plano Free. <a href="/upgrade" className="underline">Faça upgrade</a> para usar a IA.
                </span>
              )}
            </div>

            <div>
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="subtitle">Subtítulo</Label>
              <Input
                id="subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="signatureTitle">Texto de Assinatura (Título)</Label>
              <Input
                id="signatureTitle"
                value={signatureTitle}
                onChange={(e) => setSignatureTitle(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="signatureSubtitle">Texto de Assinatura (Subtítulo)</Label>
              <Input
                id="signatureSubtitle"
                value={signatureSubtitle}
                onChange={(e) => setSignatureSubtitle(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="suggestions">Sugestões para IA</Label>
              <Textarea
                id="suggestions"
                value={suggestions}
                onChange={(e) => setSuggestions(e.target.value)}
                rows={3}
                placeholder="Adicione instruções extras para a IA refinar seu texto"
                disabled={!aiEnabled}
              />
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="min-w-[160px] flex-1">
                <Label htmlFor="titleSize">Tamanho do Título</Label>
                <Select
                  value={String(titleSize)}
                  onValueChange={(v) => setTitleSize(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={String(titleSize) + "px"} />
                  </SelectTrigger>
                  <SelectContent>
                    {sizeOptionsTitle.map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        {s}px
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-[160px] flex-1">
                <Label htmlFor="subtitleSize">Tamanho do Subtítulo (da capa/conteúdo inicial)</Label>
                <Select
                  value={String(subtitleSize)}
                  onValueChange={(v) => setSubtitleSize(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={String(subtitleSize) + "px"} />
                  </SelectTrigger>
                  <SelectContent>
                    {sizeOptionsSubtitle.map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        {s}px
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-[160px] flex-1">
                <Label htmlFor="h2Size">Tamanho H2 interno (##)</Label>
                <Select
                  value={String(h2Size)}
                  onValueChange={(v) => setH2Size(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={String(h2Size) + "px"} />
                  </SelectTrigger>
                  <SelectContent>
                    {sizeOptionsH2.map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        {s}px
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-[160px] flex-1">
                <Label htmlFor="h3Size">Tamanho H3 interno (###)</Label>
                <Select
                  value={String(h3Size)}
                  onValueChange={(v) => setH3Size(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={String(h3Size) + "px"} />
                  </SelectTrigger>
                  <SelectContent>
                    {sizeOptionsH3.map((s) => (
                      <SelectItem key={s} value={String(s)}>
                        {s}px
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <Label htmlFor="justifyText" className="mr-4">Justificar texto</Label>
              <Switch id="justifyText" checked={justifyText} onCheckedChange={setJustifyText} />
            </div>

            <div>
              <Label htmlFor="body">Conteúdo</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={8}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Dica: separe parágrafos com uma linha em branco. Use "## Seu subtítulo" para H2 e "### Sua sub-seção" para H3.
              </p>
            </div>

            <div className="rounded-lg border p-4 bg-white">
              <h3 className="font-semibold mb-3">Imagens no conteúdo</h3>

              <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelected}
                  disabled={uploading}
                  className="sm:max-w-xs"
                />
                <Button type="button" variant="outline" disabled className="hidden sm:inline-flex">
                  <UploadCloud className="mr-2 h-4 w-4" />
                  {uploading ? "Enviando..." : "Selecionar arquivo"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Selecione uma imagem; o sistema envia ao Supabase e preenche a URL automaticamente.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="imgUrl">URL da imagem</Label>
                  <Input
                    id="imgUrl"
                    placeholder="https://... (preenchido automaticamente após upload)"
                    value={imgUrl}
                    onChange={(e) => setImgUrl(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="imgWidth">Largura (%)</Label>
                  <Select
                    value={String(imgWidth)}
                    onValueChange={(v) => setImgWidth(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={String(imgWidth) + "%"} />
                    </SelectTrigger>
                    <SelectContent>
                      {widthOptions.map((w) => (
                        <SelectItem key={w} value={String(w)}>{w}%</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="imgAfter">Posição</Label>
                  <Select
                    value={String(imgAfterPara)}
                    onValueChange={(v) => setImgAfterPara(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Posição" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Antes do 1º parágrafo</SelectItem>
                      {Array.from({ length: Math.max(1, paragraphs.length) }).map((_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          Após o parágrafo {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="imgCaption">Legenda (opcional)</Label>
                  <Input
                    id="imgCaption"
                    placeholder="Legenda da imagem"
                    value={imgCaption}
                    onChange={(e) => setImgCaption(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end mt-3">
                <Button variant="secondary" onClick={handleAddImage} disabled={!imgUrl}>
                  Adicionar imagem ao conteúdo
                </Button>
              </div>

              {images.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Imagens adicionadas</h4>
                  <ul className="space-y-2">
                    {images.map((im, idx) => (
                      <li key={im.src + "-" + idx} className="flex items-center justify-between rounded-md border p-2">
                        <div className="text-sm">
                          <div className="font-medium break-all">{im.src}</div>
                          <div className="text-muted-foreground">
                            {im.width}% • Após parágrafo {im.afterParagraph || 0}
                            {im.afterParagraph === 0 ? " (início)" : ""}
                            {im.caption ? " • \"" + im.caption + "\"" : ""}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleRemoveImage(idx)}>
                          Remover
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <Button onClick={handleGenerate}>Gerar PDF</Button>
              <Button onClick={handleGenerateWithAI} disabled={loadingAI || !aiEnabled}>
                {aiEnabled ? (loadingAI ? "Gerando IA…" : "Gerar com IA") : "IA indisponível"}
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                Imprimir
              </Button>
              <ExportPDFButton filename={exportFilename} disabled={!generated} titleForHistory={title} />
            </div>
          </CardContent>
        </Card>
        {generated && (
          <div className="mt-8">
            <PDFGenerator data={generated} />
          </div>
        )}
      </div>
    </div>
  )
}