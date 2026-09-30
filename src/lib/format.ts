import type { L, Locale } from "./schema";

const MONTHS: Record<Locale, string[]> = {
  pt: ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

/** Texto bilíngue na língua pedida, com recurso à outra se estiver vazio. */
export function t(l: L | undefined, lang: Locale): string {
  if (!l) return "";
  return (l[lang] || l[lang === "pt" ? "en" : "pt"] || "").trim();
}

/** Tags podem ter tradução com a sintaxe "pt|en". */
export function tag(value: string, lang: Locale): string {
  const [pt, en] = value.split("|").map((s) => s.trim());
  return lang === "en" ? en || pt : pt;
}

export function month(value: string, lang: Locale): string {
  if (!value) return "";
  const [y, m] = value.split("-");
  if (!m) return y;
  return `${MONTHS[lang][Number(m) - 1] ?? m} ${y}`;
}

export function range(start: string, end: string, current: boolean, lang: Locale): string {
  const s = month(start, lang);
  if (current) return `${s} — ${lang === "pt" ? "atual" : "present"}`;
  const e = month(end, lang);
  if (!e || e === s) return s;
  if (!s) return e;
  return `${s} — ${e}`;
}

/** Duração aproximada, ex. "2 anos 3 meses" / "2 yrs 3 mos". */
export function duration(start: string, end: string, current: boolean, lang: Locale, now = new Date()): string {
  if (!/^\d{4}-\d{2}$/.test(start)) return "";
  const [sy, sm] = start.split("-").map(Number);
  let ey: number, em: number;
  if (current || !end) [ey, em] = [now.getFullYear(), now.getMonth() + 1];
  else if (/^\d{4}-\d{2}$/.test(end)) [ey, em] = end.split("-").map(Number);
  else return "";
  const total = (ey - sy) * 12 + (em - sm) + 1;
  if (total <= 0) return "";
  const y = Math.floor(total / 12);
  const m = total % 12;
  const parts: string[] = [];
  if (lang === "pt") {
    if (y) parts.push(`${y} ${y === 1 ? "ano" : "anos"}`);
    if (m) parts.push(`${m} ${m === 1 ? "mês" : "meses"}`);
  } else {
    if (y) parts.push(`${y} ${y === 1 ? "yr" : "yrs"}`);
    if (m) parts.push(`${m} ${m === 1 ? "mo" : "mos"}`);
  }
  return parts.join(" ");
}

export function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}
