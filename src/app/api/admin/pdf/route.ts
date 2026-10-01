import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import { getContent, getPrivate } from "@/lib/store";
import { readPhoto } from "@/lib/photo";
import { isLocale } from "@/lib/schema";
import { renderCv } from "@/pdf/CvDocument";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export async function GET(req: NextRequest) {
  // O middleware já bloqueia, mas validamos aqui também.
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const lang = sp.get("lang") ?? "pt";
  if (!isLocale(lang)) return NextResponse.json({ error: "lang" }, { status: 400 });

  let stage = "carregar dados";
  let pdf: Buffer;
  let content: Awaited<ReturnType<typeof getContent>>;
  let ctx: (typeof content)["contexts"][number];
  try {
    content = await getContent();
    ctx = content.contexts.find((c) => c.id === sp.get("context")) ?? content.contexts[0];
    stage = "ler foto";
    const [priv, photo] = await Promise.all([getPrivate(), ctx.showPhoto ? readPhoto(content.profile.photoUrl) : null]);
    stage = "gerar PDF";
    try {
      pdf = await renderCv({ content, priv, ctx, lang, photo });
    } catch (e) {
      if (!photo) throw e;
      console.error("[pdf] falhou com foto, a tentar sem foto:", e);
      stage = "gerar PDF (sem foto)";
      pdf = await renderCv({ content, priv, ctx, lang, photo: null });
    }
  } catch (e) {
    // Só o admin chega aqui, por isso é seguro mostrar o erro para diagnóstico.
    console.error(`[pdf] erro ao ${stage}:`, e);
    const err = e instanceof Error ? `${e.name}: ${e.message}\n\n${(e.stack ?? "").split("\n").slice(1, 8).join("\n")}` : String(e);
    return new NextResponse(`Erro ao ${stage}.\n\n${err}`, {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
  const filename = `CV-${slug(content.profile.name)}-${slug(ctx.label.en || ctx.id)}-${lang.toUpperCase()}.pdf`;

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${sp.get("download") ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
