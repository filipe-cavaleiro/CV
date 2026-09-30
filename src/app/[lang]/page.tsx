import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getContent } from "@/lib/store";
import { getDict } from "@/lib/i18n";
import { duration, hostOf, month, range, t, tag } from "@/lib/format";
import { isLocale, type Certification, type Locale } from "@/lib/schema";
import { Rich } from "@/components/Rich";
import { TopBar } from "@/components/site/TopBar";
import { ContactForm } from "@/components/site/ContactForm";

export const dynamicParams = false;
export const revalidate = false; // regenerada quando guardas no backoffice

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const { profile } = await getContent();
  const title = `${profile.name} — ${t(profile.headline, lang)}`;
  const description = t(profile.summary, lang).replace(/\*\*/g, "").split("\n")[0].slice(0, 180);
  return {
    title,
    description,
    alternates: { canonical: `/${lang}`, languages: { "pt-PT": "/pt", en: "/en" } },
    openGraph: { title, description, type: "profile", locale: lang === "pt" ? "pt_PT" : "en_GB" },
    robots: { index: true, follow: true },
  };
}

const visible = <T extends { hidden: boolean }>(a: T[]) => a.filter((x) => !x.hidden);

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="section" aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className="section-title">
        {title}
      </h2>
      <div className="section-body">{children}</div>
    </section>
  );
}

function Ext({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  if (!href) return <>{children}</>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
      <span className="ext" aria-hidden="true">
        ↗
      </span>
    </a>
  );
}

function Tech({ items, lang }: { items: string[]; lang: Locale }) {
  if (!items.length) return null;
  return (
    <p className="tech">
      {items.map((x, i) => (
        <span key={i}>{tag(x, lang)}</span>
      ))}
    </p>
  );
}

function CertList({ items, lang, d }: { items: Certification[]; lang: Locale; d: ReturnType<typeof getDict> }) {
  return (
    <ul className="rows">
      {items.map((c) => (
        <li key={c.id} className="row">
          <div className="row-main">
            <p className="row-title">
              <Ext href={c.url}>{t(c.name, lang)}</Ext>
            </p>
            <p className="row-sub">
              {c.issuer}
              {c.credentialId && (
                <>
                  <span className="sep">·</span>
                  {d.credential} {c.credentialId}
                </>
              )}
            </p>
            {t(c.description, lang) && <Rich text={t(c.description, lang)} className="row-desc" />}
          </div>
          <p className="row-meta">
            {month(c.date, lang)}
            {c.expires && (
              <span className="muted">
                {" "}
                · {d.expires} {month(c.expires, lang)}
              </span>
            )}
          </p>
        </li>
      ))}
    </ul>
  );
}

export default async function Page({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const d = getDict(lang);
  const c = await getContent();
  const p = c.profile;

  const experience = visible(c.experience);
  const education = visible(c.education);
  const projects = visible(c.projects);
  const proCerts = visible(c.proCertifications);
  const certs = visible(c.certifications);
  const skills = visible(c.skills);
  const languages = visible(c.languages);
  const awards = visible(c.awards);
  const interests = t(p.interests, lang);

  const nav = [
    { id: "about", label: d.nav.about },
    experience.length && { id: "experience", label: d.nav.experience },
    projects.length && { id: "projects", label: d.nav.projects },
    education.length && { id: "education", label: d.nav.education },
    skills.length && { id: "skills", label: d.nav.skills },
    { id: "contact", label: d.nav.contact },
  ].filter(Boolean) as { id: string; label: string }[];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: p.name,
    jobTitle: t(p.headline, lang),
    sameAs: p.links.map((l) => l.url).filter((u) => u.startsWith("http")),
    alumniOf: education.map((e) => ({ "@type": "CollegeOrUniversity", name: e.institution })),
  };

  return (
    <>
      <a href="#main" className="skip">
        {lang === "pt" ? "Saltar para o conteúdo" : "Skip to content"}
      </a>
      <TopBar name={p.name} items={nav} lang={lang} switchLabel={d.switchLangLabel} switchTitle={d.switchLangLabel} />

      <main id="main" className="page">
        <div id="top" />
        <header className={`hero${p.photoUrl ? " has-photo" : ""}`}>
          <div className="hero-text">
            <h1 className="hero-name">{p.name}</h1>
            <p className="hero-headline">{t(p.headline, lang)}</p>
            <ul className="hero-meta">
              {t(p.location, lang) && <li>{t(p.location, lang)}</li>}
              {t(p.availability, lang) && <li className="avail">{t(p.availability, lang)}</li>}
            </ul>
            <div className="hero-actions">
              <a href="#contact" className="btn">
                {d.contact.title}
              </a>
              {p.links.map((l) => (
                <Ext key={l.id} href={l.url} className="hero-link">
                  {l.label}
                </Ext>
              ))}
            </div>
          </div>
          {p.photoUrl && (
            <figure className="hero-photo">
              <Image src={p.photoUrl} alt={p.name} width={320} height={400} priority sizes="(max-width: 720px) 128px, 240px" />
            </figure>
          )}
        </header>

        <Section id="about" title={d.sections.summary}>
          <Rich text={t(p.summary, lang)} className="lead" />
        </Section>

        {experience.length > 0 && (
          <Section id="experience" title={d.sections.experience}>
            <ol className="timeline">
              {experience.map((e) => (
                <li key={e.id} className="entry">
                  <div className="entry-when">
                    <span>{range(e.start, e.end, e.current, lang)}</span>
                    <span className="muted">{duration(e.start, e.end, e.current, lang)}</span>
                  </div>
                  <div className="entry-body">
                    <h3 className="entry-title">{t(e.role, lang)}</h3>
                    <p className="entry-sub">
                      <Ext href={e.companyUrl}>{e.company}</Ext>
                      {t(e.location, lang) && (
                        <>
                          <span className="sep">·</span>
                          <span className="muted">{t(e.location, lang)}</span>
                        </>
                      )}
                    </p>
                    <Rich text={t(e.description, lang)} />
                    {t(e.note, lang) && <p className="note">{t(e.note, lang)}</p>}
                    <Tech items={e.tech} lang={lang} />
                  </div>
                </li>
              ))}
            </ol>
          </Section>
        )}

        {projects.length > 0 && (
          <Section id="projects" title={d.sections.projects}>
            <ul className="projects">
              {projects.map((pr) => (
                <li key={pr.id} className="project">
                  <div className="project-head">
                    <h3 className="project-title">{t(pr.name, lang)}</h3>
                    <span className="row-meta">{month(pr.date, lang)}</span>
                  </div>
                  {t(pr.summary, lang) && <p className="project-summary">{t(pr.summary, lang)}</p>}
                  <Rich text={t(pr.description, lang)} />
                  <Tech items={pr.tech} lang={lang} />
                  {(pr.url || pr.repo) && (
                    <p className="project-links">
                      {pr.url && <Ext href={pr.url}>{d.visit}</Ext>}
                      {pr.repo && <Ext href={pr.repo}>{d.code}</Ext>}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {education.length > 0 && (
          <Section id="education" title={d.sections.education}>
            <ol className="timeline">
              {education.map((e) => (
                <li key={e.id} className="entry">
                  <div className="entry-when">
                    <span>{range(e.start, e.end, e.current, lang)}</span>
                  </div>
                  <div className="entry-body">
                    <h3 className="entry-title">{t(e.degree, lang)}</h3>
                    <p className="entry-sub">
                      <Ext href={e.institutionUrl}>{e.institution}</Ext>
                      {t(e.location, lang) && (
                        <>
                          <span className="sep">·</span>
                          <span className="muted">{t(e.location, lang)}</span>
                        </>
                      )}
                    </p>
                    {(t(e.grade, lang) || t(e.thesis, lang)) && (
                      <dl className="facts">
                        {t(e.grade, lang) && (
                          <div>
                            <dt>{d.grade}</dt>
                            <dd>{t(e.grade, lang)}</dd>
                          </div>
                        )}
                        {t(e.thesis, lang) && (
                          <div>
                            <dt>{d.thesis}</dt>
                            <dd>
                              <em>{t(e.thesis, lang)}</em>
                            </dd>
                          </div>
                        )}
                      </dl>
                    )}
                    <Rich text={t(e.description, lang)} />
                  </div>
                </li>
              ))}
            </ol>
          </Section>
        )}

        {proCerts.length > 0 && (
          <Section id="pro-certifications" title={d.sections.proCertifications}>
            <CertList items={proCerts} lang={lang} d={d} />
          </Section>
        )}

        {certs.length > 0 && (
          <Section id="certifications" title={d.sections.certifications}>
            <CertList items={certs} lang={lang} d={d} />
          </Section>
        )}

        {skills.length > 0 && (
          <Section id="skills" title={d.sections.skills}>
            <dl className="skills">
              {skills.map((g) => (
                <div key={g.id}>
                  <dt>{t(g.name, lang)}</dt>
                  <dd>
                    {g.items.map((x, i) => (
                      <span key={i}>{tag(x, lang)}</span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </Section>
        )}

        {languages.length > 0 && (
          <Section id="languages" title={d.sections.languages}>
            <ul className="langs">
              {languages.map((l) => (
                <li key={l.id}>
                  <span className="lang-name">{t(l.name, lang)}</span>
                  <span className="muted">{t(l.level, lang)}</span>
                  {l.cefr && <span className="cefr">{l.cefr}</span>}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {awards.length > 0 && (
          <Section id="awards" title={d.sections.awards}>
            <ul className="rows">
              {awards.map((a) => (
                <li key={a.id} className="row">
                  <div className="row-main">
                    <p className="row-title">{t(a.title, lang)}</p>
                    <p className="row-sub">{t(a.issuer, lang)}</p>
                    {t(a.description, lang) && <Rich text={t(a.description, lang)} className="row-desc" />}
                  </div>
                  <p className="row-meta">{month(a.date, lang)}</p>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {interests && (
          <Section id="interests" title={d.sections.interests}>
            <Rich text={interests} className="inline-list" />
          </Section>
        )}

        <Section id="contact" title={d.sections.contact}>
          <p className="contact-title">{d.contact.title}</p>
          {t(p.contactIntro, lang) && <p className="contact-intro">{t(p.contactIntro, lang)}</p>}
          <ContactForm t={d.contact} lang={lang} />
        </Section>
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <span>
            © {new Date().getFullYear()} {p.name}
          </span>
          <a href="#top">↑</a>
        </div>
      </footer>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
