import path from "node:path";
import { Document, Font, Image, Link, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import type { Content, CvContext, Locale, PrivateData } from "@/lib/schema";
import { getDict } from "@/lib/i18n";
import { duration, month, range, t, tag } from "@/lib/format";
import { parseRich, type Span } from "@/lib/rich";
import { filterForContext } from "./select";

/* ------------------------------------------------------------------ fontes */

const FONT_DIR = path.join(process.cwd(), "src", "pdf", "fonts");
let fontsReady = false;
function registerFonts() {
  if (fontsReady) return;
  const f = (name: string) => path.join(FONT_DIR, name);
  Font.register({
    family: "Serif",
    fonts: [
      { src: f("newsreader-latin-400-normal.ttf"), fontWeight: 400 },
      { src: f("newsreader-latin-400-italic.ttf"), fontWeight: 400, fontStyle: "italic" },
      { src: f("newsreader-latin-500-normal.ttf"), fontWeight: 500 },
      { src: f("newsreader-latin-600-normal.ttf"), fontWeight: 600 },
    ],
  });
  Font.register({
    family: "Sans",
    fonts: [
      { src: f("instrument-sans-latin-400-normal.ttf"), fontWeight: 400 },
      { src: f("instrument-sans-latin-500-normal.ttf"), fontWeight: 500 },
      { src: f("instrument-sans-latin-600-normal.ttf"), fontWeight: 600 },
    ],
  });
  Font.register({ family: "Mono", src: f("ibm-plex-mono-latin-400-normal.ttf") });
  Font.registerHyphenationCallback((word) => [word]);
  fontsReady = true;
}

/* ------------------------------------------------------------------ estilos */

const C = { ink: "#1b1a17", ink2: "#3a3731", muted: "#766f64", rule: "#dcd7cc", soft: "#ebe7de", accent: "#1d5a44" };
const DATE_W = 98;

const s = StyleSheet.create({
  page: { paddingTop: 42, paddingBottom: 52, paddingHorizontal: 46, fontFamily: "Sans", fontSize: 9, lineHeight: 1.42, color: C.ink },
  header: { flexDirection: "row", alignItems: "flex-end", gap: 18, paddingBottom: 16, borderBottomWidth: 0.75, borderBottomColor: C.ink },
  headerText: { flex: 1 },
  name: { fontFamily: "Serif", fontSize: 25, lineHeight: 1.05, letterSpacing: -0.4 },
  headline: { fontFamily: "Serif", fontStyle: "italic", fontSize: 12, color: C.ink2, marginTop: 5 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 8, fontSize: 8.3, color: C.ink2 },
  metaItem: { marginRight: 12, marginTop: 2 },
  metaLabel: { color: C.muted },
  photo: { width: 66, height: 82, objectFit: "cover", borderRadius: 1.5 },

  summary: { marginTop: 14, fontFamily: "Serif", fontSize: 10.2, lineHeight: 1.5, color: C.ink2 },

  section: { marginTop: 16 },
  sectionHead: { flexDirection: "row", alignItems: "center", marginBottom: 7 },
  sectionTitle: { fontFamily: "Serif", fontSize: 12.5, color: C.accent, marginRight: 8 },
  sectionRule: { flex: 1, height: 0.5, backgroundColor: C.rule },

  entry: { flexDirection: "row", paddingVertical: 5 },
  entryDivider: { borderTopWidth: 0.5, borderTopColor: C.soft },
  when: { width: DATE_W, paddingRight: 8, paddingTop: 1 },
  whenText: { fontFamily: "Mono", fontSize: 7.3, color: C.ink2, lineHeight: 1.45 },
  whenSub: { fontFamily: "Mono", fontSize: 7, color: C.muted, lineHeight: 1.45 },
  body: { flex: 1 },
  title: { fontSize: 9.6, fontWeight: 600 },
  sub: { fontSize: 8.6, color: C.muted, marginTop: 0.5, marginBottom: 2.5 },
  subStrong: { color: C.ink2, fontWeight: 500 },
  p: { color: C.ink2, marginTop: 1.5 },
  li: { flexDirection: "row", marginTop: 1.5 },
  bullet: { width: 9, color: C.muted },
  liText: { flex: 1, color: C.ink2 },
  bold: { fontWeight: 600, color: C.ink },
  note: { fontSize: 8, color: C.muted, fontStyle: "normal", marginTop: 2 },
  tech: { fontFamily: "Mono", fontSize: 7, color: C.muted, marginTop: 3 },
  facts: { fontSize: 8.6, color: C.ink2, marginBottom: 2 },

  kv: { flexDirection: "row", paddingVertical: 2.5 },
  kvKey: { width: DATE_W, paddingRight: 8, fontFamily: "Mono", fontSize: 7.3, color: C.muted, paddingTop: 1 },
  kvVal: { flex: 1, color: C.ink2 },

  footer: { position: "absolute", bottom: 24, fontFamily: "Mono", fontSize: 6.8, color: C.muted },
});

/* --------------------------------------------------------------- primitivas */

function Spans({ spans }: { spans: Span[] }) {
  return (
    <>
      {spans.map((sp, i) =>
        sp.bold ? (
          <Text key={i} style={s.bold}>
            {sp.text}
          </Text>
        ) : (
          sp.text
        ),
      )}
    </>
  );
}

function Rich({ text, style }: { text: string; style?: Style }) {
  if (!text.trim()) return null;
  return (
    <View>
      {parseRich(text).map((b, i) =>
        b.kind === "p" ? (
          <Text key={i} style={[s.p, style ?? {}]}>
            <Spans spans={b.spans} />
          </Text>
        ) : (
          <View key={i}>
            {b.items.map((it, j) => (
              <View key={j} style={s.li} wrap={false}>
                <Text style={s.bullet}>–</Text>
                <Text style={s.liText}>
                  <Spans spans={it} />
                </Text>
              </View>
            ))}
          </View>
        ),
      )}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <View style={s.sectionHead} minPresenceAhead={60} wrap={false}>
        <Text style={s.sectionTitle}>{title}</Text>
        <View style={s.sectionRule} />
      </View>
      {children}
    </View>
  );
}

function Entry({ first, when, whenSub, children }: { first: boolean; when: string; whenSub?: string; children: React.ReactNode }) {
  return (
    <View style={[s.entry, first ? {} : s.entryDivider]}>
      <View style={s.when}>
        <Text style={s.whenText}>{when}</Text>
        {whenSub ? <Text style={s.whenSub}>{whenSub}</Text> : null}
      </View>
      <View style={s.body}>{children}</View>
    </View>
  );
}

const shortUrl = (u: string) => u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

/* ---------------------------------------------------------------- documento */

type Props = {
  content: Content;
  priv: PrivateData;
  ctx: CvContext;
  lang: Locale;
  photo: { data: Buffer; format: "jpg" | "png" } | null;
};

function CvDocument({ content, priv, ctx, lang, photo }: Props) {
  const d = getDict(lang);
  const p = content.profile;
  const f = filterForContext(content, ctx);
  const has = (k: CvContext["sections"][number]) => ctx.sections.includes(k);
  const pf = (k: CvContext["privateFields"][number]) => ctx.privateFields.includes(k);

  const headline = t(ctx.headline, lang) || t(p.headline, lang);
  const summary = t(ctx.summary, lang) || t(p.summary, lang);

  const L =
    lang === "pt"
      ? { birth: "Nascimento", nat: "Nacionalidade", permit: "Autorização de trabalho" }
      : { birth: "Born", nat: "Nationality", permit: "Work authorisation" };

  const contactLine: React.ReactNode[] = [];
  if (pf("email") && priv.email)
    contactLine.push(
      <Link key="e" src={`mailto:${priv.email}`} style={{ color: C.ink2, textDecoration: "none" }}>
        {priv.email}
      </Link>,
    );
  if (pf("phone") && priv.phone) contactLine.push(<Text key="p">{priv.phone}</Text>);
  if (pf("address") && priv.address) contactLine.push(<Text key="a">{priv.address}</Text>);
  else if (t(p.location, lang)) contactLine.push(<Text key="l">{t(p.location, lang)}</Text>);
  if (pf("website") && priv.website)
    contactLine.push(
      <Link key="w" src={priv.website} style={{ color: C.ink2, textDecoration: "none" }}>
        {shortUrl(priv.website)}
      </Link>,
    );
  if (ctx.showLinks)
    p.links
      .filter((l) => l.url)
      .forEach((l) =>
        contactLine.push(
          <Link key={l.id} src={l.url} style={{ color: C.ink2, textDecoration: "none" }}>
            {shortUrl(l.url)}
          </Link>,
        ),
      );

  const personal: [string, string][] = [];
  if (pf("nationality") && t(priv.nationality, lang)) personal.push([L.nat, t(priv.nationality, lang)]);
  if (pf("workPermit") && t(priv.workPermit, lang)) personal.push([L.permit, t(priv.workPermit, lang)]);
  if (pf("birthDate") && priv.birthDate) personal.push([L.birth, priv.birthDate]);

  const interests = has("interests") ? t(p.interests, lang) : "";

  return (
    <Document title={`${p.name} — CV`} author={p.name} subject={headline} language={lang === "pt" ? "pt-PT" : "en-GB"} creator={p.name} producer="">
      <Page size="A4" style={s.page}>
        <Text style={[s.footer, { left: 46 }]} fixed>
          {p.name}
          {headline ? `  ·  ${headline}` : ""}
        </Text>
        <View style={s.header}>
          <View style={s.headerText}>
            <Text style={s.name}>{p.name}</Text>
            {headline ? <Text style={s.headline}>{headline}</Text> : null}
            {contactLine.length > 0 && (
              <View style={s.metaRow}>
                {contactLine.map((node, i) => (
                  <View key={i} style={s.metaItem}>
                    <Text>{node}</Text>
                  </View>
                ))}
              </View>
            )}
            {personal.length > 0 && (
              <View style={[s.metaRow, { marginTop: 1 }]}>
                {personal.map(([k, v]) => (
                  <Text key={k} style={s.metaItem}>
                    <Text style={s.metaLabel}>{k}: </Text>
                    {v}
                  </Text>
                ))}
              </View>
            )}
          </View>
          {ctx.showPhoto && photo ? <Image style={s.photo} src={photo} /> : null}
        </View>

        {has("summary") && summary ? <Rich text={summary} style={s.summary} /> : null}

        {f.experience.length > 0 && (
          <Section title={d.sections.experience}>
            {f.experience.map((e, i) => (
              <Entry key={e.id} first={i === 0} when={range(e.start, e.end, e.current, lang)} whenSub={duration(e.start, e.end, e.current, lang)}>
                <Text style={s.title} minPresenceAhead={30}>
                  {t(e.role, lang)}
                </Text>
                <Text style={s.sub}>
                  <Text style={s.subStrong}>{e.company}</Text>
                  {t(e.location, lang) ? `  ·  ${t(e.location, lang)}` : ""}
                </Text>
                <Rich text={t(e.description, lang)} />
                {t(e.note, lang) ? <Text style={s.note}>{t(e.note, lang)}</Text> : null}
                {e.tech.length > 0 && <Text style={s.tech}>{e.tech.map((x) => tag(x, lang)).join("  /  ")}</Text>}
              </Entry>
            ))}
          </Section>
        )}

        {f.projects.length > 0 && (
          <Section title={d.sections.projects}>
            {f.projects.map((pr, i) => (
              <Entry key={pr.id} first={i === 0} when={month(pr.date, lang)}>
                <Text style={s.title}>{t(pr.name, lang)}</Text>
                {(pr.url || pr.repo) && (
                  <Text style={s.sub}>
                    {[pr.url, pr.repo].filter(Boolean).map((u, k) => (
                      <Link key={k} src={u} style={{ color: C.muted, textDecoration: "none" }}>
                        {k > 0 ? "  ·  " : ""}
                        {shortUrl(u)}
                      </Link>
                    ))}
                  </Text>
                )}
                {t(pr.summary, lang) ? <Text style={s.p}>{t(pr.summary, lang)}</Text> : null}
                <Rich text={t(pr.description, lang)} />
                {pr.tech.length > 0 && <Text style={s.tech}>{pr.tech.map((x) => tag(x, lang)).join("  /  ")}</Text>}
              </Entry>
            ))}
          </Section>
        )}

        {f.education.length > 0 && (
          <Section title={d.sections.education}>
            {f.education.map((e, i) => (
              <Entry key={e.id} first={i === 0} when={range(e.start, e.end, e.current, lang)}>
                <Text style={s.title} minPresenceAhead={30}>
                  {t(e.degree, lang)}
                </Text>
                <Text style={s.sub}>
                  <Text style={s.subStrong}>{e.institution}</Text>
                  {t(e.location, lang) ? `  ·  ${t(e.location, lang)}` : ""}
                </Text>
                {t(e.grade, lang) ? (
                  <Text style={s.facts}>
                    <Text style={s.metaLabel}>{d.grade}: </Text>
                    {t(e.grade, lang)}
                  </Text>
                ) : null}
                {t(e.thesis, lang) ? (
                  <Text style={s.facts}>
                    <Text style={s.metaLabel}>{d.thesis}: </Text>
                    {t(e.thesis, lang)}
                  </Text>
                ) : null}
                <Rich text={t(e.description, lang)} />
              </Entry>
            ))}
          </Section>
        )}

        {([
          ["proCertifications", f.proCertifications],
          ["certifications", f.certifications],
        ] as const).map(([key, list]) =>
          list.length > 0 ? (
            <Section key={key} title={d.sections[key]}>
              {list.map((c, i) => (
                <Entry key={c.id} first={i === 0} when={month(c.date, lang)}>
                  <Text style={s.title}>
                    {c.url ? (
                      <Link src={c.url} style={{ color: C.ink, textDecoration: "none" }}>
                        {t(c.name, lang)}
                      </Link>
                    ) : (
                      t(c.name, lang)
                    )}
                  </Text>
                  <Text style={s.sub}>
                    {[c.issuer, c.credentialId && `${d.credential} ${c.credentialId}`, c.expires && `${d.expires} ${month(c.expires, lang)}`]
                      .filter(Boolean)
                      .join("  ·  ")}
                  </Text>
                  <Rich text={t(c.description, lang)} />
                </Entry>
              ))}
            </Section>
          ) : null,
        )}

        {f.skills.length > 0 && (
          <Section title={d.sections.skills}>
            {f.skills.map((g) => (
              <View key={g.id} style={s.kv} wrap={false}>
                <Text style={s.kvKey}>{t(g.name, lang)}</Text>
                <Text style={s.kvVal}>{g.items.map((x) => tag(x, lang)).join(", ")}</Text>
              </View>
            ))}
          </Section>
        )}

        {f.languages.length > 0 && (
          <Section title={d.sections.languages}>
            {f.languages.map((l) => (
              <View key={l.id} style={s.kv} wrap={false}>
                <Text style={s.kvKey}>{t(l.name, lang)}</Text>
                <Text style={s.kvVal}>
                  {t(l.level, lang)}
                  {l.cefr ? `  ·  ${l.cefr}` : ""}
                </Text>
              </View>
            ))}
          </Section>
        )}

        {f.awards.length > 0 && (
          <Section title={d.sections.awards}>
            {f.awards.map((a, i) => (
              <Entry key={a.id} first={i === 0} when={month(a.date, lang)}>
                <Text style={s.title}>{t(a.title, lang)}</Text>
                <Text style={s.sub}>{t(a.issuer, lang)}</Text>
                <Rich text={t(a.description, lang)} />
              </Entry>
            ))}
          </Section>
        )}

        {interests ? (
          <Section title={d.sections.interests}>
            <Text style={s.p}>
              {parseRich(interests)
                .flatMap((b) => (b.kind === "ul" ? b.items.map((it) => it.map((x) => x.text).join("")) : [b.spans.map((x) => x.text).join("")]))
                .join("  ·  ")}
            </Text>
          </Section>
        ) : null}

      </Page>
    </Document>
  );
}

export async function renderCv(props: Props): Promise<Buffer> {
  registerFonts();
  return renderToBuffer(<CvDocument {...props} />);
}
