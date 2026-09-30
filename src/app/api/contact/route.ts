import { NextResponse, type NextRequest } from "next/server";
import { ContactSchema } from "@/lib/schema";
import { messages, rateLimited } from "@/lib/store";
import { clientKey } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIN_FILL_MS = 3000;

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

async function sendEmail(m: { name: string; email: string; message: string; lang: string }) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL || "CV <onboarding@resend.dev>";
  if (!key || !to) {
    console.warn("[contact] RESEND_API_KEY/CONTACT_TO_EMAIL não definidos — mensagem só guardada no backoffice.");
    return false;
  }
  const safeName = m.name.replace(/[\r\n]+/g, " ").slice(0, 100);
  const html = `
    <div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.55;color:#1b1a17">
      <p style="margin:0 0 4px;color:#766f64;font-size:13px">Nova mensagem através do site (${esc(m.lang)})</p>
      <p style="margin:0 0 16px"><strong>${esc(safeName)}</strong> &lt;${esc(m.email)}&gt;</p>
      <div style="white-space:pre-wrap;border-left:2px solid #1d5a44;padding-left:14px">${esc(m.message)}</div>
      <p style="margin:20px 0 0;color:#766f64;font-size:13px">Responde diretamente a este email para contactar ${esc(safeName)}.</p>
    </div>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: m.email,
      subject: `Contacto via CV — ${safeName}`,
      html,
      text: `${safeName} <${m.email}>\n\n${m.message}`,
    }),
  });
  if (!res.ok) {
    console.error("[contact] Resend falhou", res.status, await res.text().catch(() => ""));
    return false;
  }
  return true;
}

export async function POST(req: NextRequest) {
  // Só aceita pedidos do próprio site.
  const origin = req.headers.get("origin");
  if (origin) {
    let sameHost = false;
    try {
      sameHost = new URL(origin).host === req.headers.get("host");
    } catch {}
    if (!sameHost) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const raw = await req.text();
  if (raw.length > 20_000) return NextResponse.json({ error: "too_large" }, { status: 413 });

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const lang = (body as { lang?: unknown })?.lang === "en" ? "en" : "pt";

  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) {
    // honeypot preenchido → finge sucesso para não dar pistas aos bots
    if ((body as { website?: string })?.website) return NextResponse.json({ ok: true });
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const { name, email, message, t } = parsed.data;
  if (Date.now() - t < MIN_FILL_MS) return NextResponse.json({ ok: true });

  if ((await rateLimited(await clientKey("contact"), 3, 600)) || (await rateLimited("contact:global", 40, 3600))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let delivered = false;
  try {
    delivered = await sendEmail({ name, email, message, lang });
  } catch (e) {
    console.error("[contact] erro a enviar", e);
  }
  try {
    await messages.add({ name, email, body: message, delivered });
  } catch (e) {
    console.error("[contact] erro a guardar", e);
    if (!delivered) return NextResponse.json({ error: "failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
