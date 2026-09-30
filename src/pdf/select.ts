import type { Content, CvContext } from "@/lib/schema";

/** Itens que entram num contexto: sem contextos marcados = todos. Ignora a flag "hidden" (é só para o site). */
export function filterForContext(content: Content, ctx: CvContext) {
  const pick = <T extends { contexts: string[] }>(arr: T[]) => arr.filter((x) => x.contexts.length === 0 || x.contexts.includes(ctx.id));
  const on = (k: CvContext["sections"][number]) => ctx.sections.includes(k);
  return {
    experience: on("experience") ? pick(content.experience) : [],
    education: on("education") ? pick(content.education) : [],
    projects: on("projects") ? pick(content.projects) : [],
    proCertifications: on("proCertifications") ? pick(content.proCertifications) : [],
    certifications: on("certifications") ? pick(content.certifications) : [],
    awards: on("awards") ? pick(content.awards) : [],
    skills: on("skills") ? pick(content.skills) : [],
    languages: on("languages") ? pick(content.languages) : [],
  };
}
