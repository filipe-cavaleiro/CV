import { z } from "zod";

export const LOCALES = ["pt", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

/** Texto bilíngue. */
const LObj = z.object({
  pt: z.string().max(8000).default(""),
  en: z.string().max(8000).default(""),
});
const L = LObj.default({ pt: "", en: "" });
export type L = z.infer<typeof LObj>;

const id = z.string().min(1).max(64);
const month = z
  .string()
  .regex(/^(\d{4}(-\d{2})?)?$/, "Formato AAAA-MM")
  .default("");
const url = z
  .string()
  .max(500)
  .refine((v) => v === "" || /^https?:\/\//i.test(v) || v.startsWith("/"), "Tem de começar por https://")
  .default("");
const shortText = z.string().max(300).default("");
const tags = z.array(z.string().max(80)).max(60).default([]);

/** Campos comuns a todos os itens de coleções. */
const itemBase = {
  id,
  /** Esconder no site público (continua disponível para PDF). */
  hidden: z.boolean().default(false),
  /** Contextos de PDF onde o item entra. Vazio = todos. */
  contexts: z.array(z.string().max(64)).default([]),
};

export const ExperienceSchema = z.object({
  ...itemBase,
  role: L,
  company: shortText,
  companyUrl: url,
  location: L,
  start: month,
  end: month,
  current: z.boolean().default(false),
  description: L,
  note: L,
  tech: tags,
});

export const EducationSchema = z.object({
  ...itemBase,
  degree: L,
  institution: shortText,
  institutionUrl: url,
  location: L,
  start: month,
  end: month,
  current: z.boolean().default(false),
  grade: L,
  thesis: L,
  description: L,
});

export const CertificationSchema = z.object({
  ...itemBase,
  name: L,
  issuer: shortText,
  date: month,
  expires: month,
  credentialId: shortText,
  url,
  description: L,
});

export const ProjectSchema = z.object({
  ...itemBase,
  name: L,
  summary: L,
  description: L,
  date: month,
  url,
  repo: url,
  tech: tags,
});

export const AwardSchema = z.object({
  ...itemBase,
  title: L,
  issuer: L,
  date: month,
  description: L,
});

export const SkillGroupSchema = z.object({
  ...itemBase,
  name: L,
  items: tags,
});

export const LanguageSchema = z.object({
  ...itemBase,
  name: L,
  level: L,
  cefr: shortText,
});

export const LinkSchema = z.object({
  id,
  label: shortText,
  url,
});

export const ProfileSchema = z.object({
  name: shortText,
  headline: L,
  summary: L,
  location: L,
  availability: L,
  interests: L,
  photoUrl: url,
  links: z.array(LinkSchema).max(12).default([]),
  contactIntro: L,
});

export const SECTION_KEYS = [
  "summary",
  "experience",
  "projects",
  "education",
  "proCertifications",
  "certifications",
  "skills",
  "languages",
  "awards",
  "interests",
] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export const PRIVATE_FIELD_KEYS = ["email", "phone", "address", "birthDate", "nationality", "workPermit", "website"] as const;
export type PrivateFieldKey = (typeof PRIVATE_FIELD_KEYS)[number];

export const ContextSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,40}$/, "Só minúsculas, números e hífens"),
  label: L,
  /** Substituem o título/resumo do perfil neste contexto (se preenchidos). */
  headline: L,
  summary: L,
  sections: z.array(z.enum(SECTION_KEYS)).default([...SECTION_KEYS]),
  privateFields: z.array(z.enum(PRIVATE_FIELD_KEYS)).default(["email", "phone"]),
  showPhoto: z.boolean().default(true),
  showLinks: z.boolean().default(true),
});

export const ContentSchema = z.object({
  profile: ProfileSchema,
  experience: z.array(ExperienceSchema).max(100).default([]),
  education: z.array(EducationSchema).max(100).default([]),
  proCertifications: z.array(CertificationSchema).max(200).default([]),
  certifications: z.array(CertificationSchema).max(200).default([]),
  projects: z.array(ProjectSchema).max(100).default([]),
  awards: z.array(AwardSchema).max(100).default([]),
  skills: z.array(SkillGroupSchema).max(50).default([]),
  languages: z.array(LanguageSchema).max(30).default([]),
  contexts: z.array(ContextSchema).min(1).max(20),
});

/** Dados que NUNCA vão para o site público — só para o PDF gerado no backoffice. */
export const PrivateSchema = z.object({
  email: shortText,
  phone: shortText,
  address: shortText,
  birthDate: shortText,
  nationality: L,
  workPermit: L,
  website: shortText,
});

export type Experience = z.infer<typeof ExperienceSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type Certification = z.infer<typeof CertificationSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Award = z.infer<typeof AwardSchema>;
export type SkillGroup = z.infer<typeof SkillGroupSchema>;
export type Language = z.infer<typeof LanguageSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type CvContext = z.infer<typeof ContextSchema>;
export type Content = z.infer<typeof ContentSchema>;
export type PrivateData = z.infer<typeof PrivateSchema>;

/** Secções editáveis como lista no backoffice. */
export const COLLECTION_SCHEMAS = {
  experience: ExperienceSchema,
  education: EducationSchema,
  proCertifications: CertificationSchema,
  certifications: CertificationSchema,
  projects: ProjectSchema,
  awards: AwardSchema,
  skills: SkillGroupSchema,
  languages: LanguageSchema,
  contexts: ContextSchema,
} as const;
export type CollectionKey = keyof typeof COLLECTION_SCHEMAS;

export const ContactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(10).max(5000),
  /** honeypot: tem de vir vazio */
  website: z.string().max(0).optional().default(""),
  /** instante em que o formulário foi renderizado (ms) */
  t: z.number().int().positive(),
});
