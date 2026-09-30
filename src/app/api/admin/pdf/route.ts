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

  const content = await getContent();
  const ctx = content.contexts.find((c) => c.id === sp.get("context")) ?? content.contexts[0];
  const [priv, photo] = await Promise.all([getPrivate(), ctx.showPhoto ? readPhoto(content.profile.photoUrl) : null]);

  const pdf = await renderCv({ content, priv, ctx, lang, photo });
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
