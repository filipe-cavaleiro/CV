import type { CollectionKey, PrivateFieldKey, SectionKey } from "@/lib/schema";

export type Field = {
  name: string;
  label: string;
  type: "text" | "url" | "month" | "slug" | "l10n" | "l10nArea" | "checkbox" | "tags" | "contexts" | "sections" | "privateFields";
  hint?: string;
  placeholder?: string;
  rows?: number;
  /** ocupa metade da largura */
  half?: boolean;
};

type AnyItem = Record<string, any>;

export type CollectionConfig = {
  slug: string;
  title: string;
  singular: string;
  intro: string;
  fields: Field[];
  summary: (it: AnyItem) => { title: string; sub?: string; meta?: string };
};

export const SECTION_LABELS: Record<SectionKey, string> = {
  summary: "Resumo",
  experience: "Experiência",
  projects: "Projetos",
  education: "Formação",
  proCertifications: "Certificações profissionais",
  certifications: "Cursos e certificados",
  skills: "Competências",
  languages: "Línguas",
  awards: "Prémios",
  interests: "Interesses",
};

export const PRIVATE_LABELS: Record<PrivateFieldKey, string> = {
  email: "Email",
  phone: "Telefone",
  address: "Morada",
  birthDate: "Data de nascimento",
  nationality: "Nacionalidade",
  workPermit: "Autorização de trabalho",
  website: "Website",
};

const RICH_HINT = "Uma linha começada por “- ” vira um ponto de lista. **texto** fica a negrito.";
const TAGS_HINT = "Separadas por vírgulas. Para traduzir uma tag usa “pt|en”, ex.: Bases de dados|Databases";

const common: Field[] = [
  { name: "hidden", label: "Esconder no site público", type: "checkbox", hint: "Continua disponível para os PDFs." },
  { name: "contexts", label: "Incluir nos PDFs", type: "contexts" },
];

const pt = (l?: { pt?: string; en?: string }) => l?.pt || l?.en || "";
const period = (it: AnyItem) => [it.start, it.current ? "atual" : it.end].filter(Boolean).join(" → ");

const certFields: Field[] = [
  { name: "name", label: "Nome", type: "l10n" },
  { name: "issuer", label: "Entidade emissora", type: "text", half: true, placeholder: "ex.: Microsoft" },
  { name: "credentialId", label: "ID da credencial", type: "text", half: true },
  { name: "date", label: "Data de emissão", type: "month", half: true },
  { name: "expires", label: "Válido até", type: "month", half: true, hint: "Vazio se não expira." },
  { name: "url", label: "Link de verificação", type: "url" },
  { name: "description", label: "Descrição (opcional)", type: "l10nArea", rows: 3, hint: RICH_HINT },
  ...common,
];

export const COLLECTIONS: Record<CollectionKey, CollectionConfig> = {
  experience: {
    slug: "experience",
    title: "Experiência",
    singular: "experiência",
    intro: "Empregos e estágios, do mais recente para o mais antigo (a ordem da lista é a ordem no site).",
    fields: [
      { name: "role", label: "Função", type: "l10n" },
      { name: "company", label: "Empresa", type: "text", half: true },
      { name: "companyUrl", label: "Website da empresa", type: "url", half: true },
      { name: "location", label: "Localização", type: "l10n", hint: "Cidade e país chegam — nunca a morada." },
      { name: "start", label: "Início", type: "month", half: true },
      { name: "end", label: "Fim", type: "month", half: true },
      { name: "current", label: "Trabalho aqui atualmente", type: "checkbox" },
      { name: "description", label: "Descrição", type: "l10nArea", rows: 7, hint: RICH_HINT },
      { name: "note", label: "Nota (ex.: estágio curricular)", type: "l10n" },
      { name: "tech", label: "Tecnologias", type: "tags", hint: TAGS_HINT },
      ...common,
    ],
    summary: (it) => ({ title: pt(it.role) || "(sem função)", sub: it.company, meta: period(it) }),
  },
  education: {
    slug: "education",
    title: "Formação",
    singular: "formação",
    intro: "Graus académicos e cursos longos.",
    fields: [
      { name: "degree", label: "Curso / grau", type: "l10n" },
      { name: "institution", label: "Instituição", type: "text", half: true },
      { name: "institutionUrl", label: "Website", type: "url", half: true },
      { name: "location", label: "Localização", type: "l10n" },
      { name: "start", label: "Início", type: "month", half: true },
      { name: "end", label: "Fim", type: "month", half: true },
      { name: "current", label: "Em curso", type: "checkbox" },
      { name: "grade", label: "Classificação", type: "l10n" },
      { name: "thesis", label: "Tese / projeto final", type: "l10n" },
      { name: "description", label: "Descrição", type: "l10nArea", rows: 6, hint: RICH_HINT },
      ...common,
    ],
    summary: (it) => ({ title: pt(it.degree) || "(sem título)", sub: it.institution, meta: period(it) }),
  },
  proCertifications: {
    slug: "pro-certifications",
    title: "Certificações profissionais",
    singular: "certificação",
    intro: "Certificações com exame e credencial verificável (ex.: Microsoft, AWS, Scrum).",
    fields: certFields,
    summary: (it) => ({ title: pt(it.name) || "(sem nome)", sub: it.issuer, meta: it.date }),
  },
  certifications: {
    slug: "certifications",
    title: "Cursos e certificados",
    singular: "certificado",
    intro: "Cursos online, workshops e certificados de participação.",
    fields: certFields,
    summary: (it) => ({ title: pt(it.name) || "(sem nome)", sub: it.issuer, meta: it.date }),
  },
  projects: {
    slug: "projects",
    title: "Projetos pessoais",
    singular: "projeto",
    intro: "Projetos pessoais, académicos ou open source.",
    fields: [
      { name: "name", label: "Nome", type: "l10n" },
      { name: "summary", label: "Resumo (uma frase)", type: "l10n" },
      { name: "description", label: "Descrição", type: "l10nArea", rows: 5, hint: RICH_HINT },
      { name: "date", label: "Data", type: "month", half: true },
      { name: "url", label: "Link do projeto", type: "url", half: true },
      { name: "repo", label: "Repositório", type: "url" },
      { name: "tech", label: "Tecnologias", type: "tags", hint: TAGS_HINT },
      ...common,
    ],
    summary: (it) => ({ title: pt(it.name) || "(sem nome)", sub: pt(it.summary), meta: it.date }),
  },
  awards: {
    slug: "awards",
    title: "Prémios e distinções",
    singular: "prémio",
    intro: "Competições, prémios e distinções.",
    fields: [
      { name: "title", label: "Título", type: "l10n" },
      { name: "issuer", label: "Entidade", type: "l10n" },
      { name: "date", label: "Data", type: "month", half: true },
      { name: "description", label: "Descrição", type: "l10nArea", rows: 3, hint: RICH_HINT },
      ...common,
    ],
    summary: (it) => ({ title: pt(it.title) || "(sem título)", sub: pt(it.issuer), meta: it.date }),
  },
  skills: {
    slug: "skills",
    title: "Competências",
    singular: "grupo",
    intro: "Grupos de competências (ex.: Linguagens, Frameworks).",
    fields: [
      { name: "name", label: "Nome do grupo", type: "l10n" },
      { name: "items", label: "Competências", type: "tags", hint: TAGS_HINT },
      ...common,
    ],
    summary: (it) => ({ title: pt(it.name) || "(sem nome)", sub: (it.items ?? []).map((x: string) => x.split("|")[0]).join(", ") }),
  },
  languages: {
    slug: "languages",
    title: "Línguas",
    singular: "língua",
    intro: "Línguas e nível (QECR: A1–C2).",
    fields: [
      { name: "name", label: "Língua", type: "l10n" },
      { name: "level", label: "Nível", type: "l10n", placeholder: "ex.: Fluente" },
      { name: "cefr", label: "QECR", type: "text", half: true, placeholder: "ex.: C1" },
      ...common,
    ],
    summary: (it) => ({ title: pt(it.name) || "(sem nome)", sub: pt(it.level), meta: it.cefr }),
  },
  contexts: {
    slug: "contexts",
    title: "Contextos de PDF",
    singular: "contexto",
    intro:
      "Cada contexto é uma versão do CV em PDF (ex.: Geral, IT). Em cada item escolhes em que contextos entra; um item sem contextos marcados entra em todos.",
    fields: [
      { name: "label", label: "Nome", type: "l10n" },
      { name: "id", label: "Identificador", type: "slug", half: true, hint: "Minúsculas e hífens, ex.: it, geral, gestao." },
      { name: "headline", label: "Título alternativo", type: "l10n", hint: "Opcional — substitui o título do perfil neste PDF." },
      { name: "summary", label: "Resumo alternativo", type: "l10nArea", rows: 5, hint: "Opcional — substitui o resumo do perfil neste PDF." },
      { name: "sections", label: "Secções incluídas", type: "sections" },
      { name: "privateFields", label: "Dados pessoais no PDF", type: "privateFields", hint: "Vêm de “Dados privados”. Nunca aparecem no site." },
      { name: "showPhoto", label: "Incluir foto", type: "checkbox" },
      { name: "showLinks", label: "Incluir links do perfil", type: "checkbox" },
    ],
    summary: (it) => ({ title: pt(it.label) || it.id, meta: it.id }),
  },
};

export const SLUG_TO_KEY: Record<string, CollectionKey> = Object.fromEntries(
  Object.entries(COLLECTIONS).map(([k, v]) => [v.slug, k as CollectionKey]),
);

export const PROFILE_FIELDS: Field[] = [
  { name: "name", label: "Nome", type: "text" },
  { name: "headline", label: "Título profissional", type: "l10n" },
  { name: "summary", label: "Sobre mim", type: "l10nArea", rows: 10, hint: RICH_HINT },
  { name: "location", label: "Localização pública", type: "l10n", hint: "Só país ou cidade. A morada completa vai em “Dados privados”." },
  { name: "availability", label: "Disponibilidade", type: "l10n", placeholder: "ex.: Aberto a oportunidades remotas" },
  { name: "interests", label: "Interesses", type: "l10nArea", rows: 4, hint: RICH_HINT },
  { name: "contactIntro", label: "Texto da secção de contacto", type: "l10nArea", rows: 3 },
];

export const PRIVATE_FIELDS: Field[] = [
  { name: "email", label: "Email", type: "text", half: true },
  { name: "phone", label: "Telefone", type: "text", half: true },
  { name: "address", label: "Morada", type: "text" },
  { name: "birthDate", label: "Data de nascimento", type: "text", half: true, placeholder: "dd/mm/aaaa" },
  { name: "website", label: "Website", type: "text", half: true },
  { name: "nationality", label: "Nacionalidade", type: "l10n" },
  { name: "workPermit", label: "Autorização de trabalho", type: "l10n" },
];
