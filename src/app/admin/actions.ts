"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { checkPassword, clientKey, endSession, requireAdmin, startSession } from "@/lib/auth";
import { getContent, getPrivate, messages, rateLimited, saveContent, savePrivate as storePrivate } from "@/lib/store";
import { deletePhoto, storePhoto } from "@/lib/photo";
import { COLLECTION_SCHEMAS, PrivateSchema, ProfileSchema, type CollectionKey, type Content } from "@/lib/schema";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

function formatIssues(err: z.ZodError): string {
  return err.issues
    .slice(0, 6)
    .map((i) => {
      const path = i.path.map((p) => (typeof p === "number" ? `#${p + 1}` : String(p))).join(" › ");
      return path ? `${path}: ${i.message}` : i.message;
    })
    .join("\n");
}

function refreshSite() {
  revalidatePath("/pt");
  revalidatePath("/en");
}

/* -------------------------------------------------------------- sessão */

export async function login(_: { error?: string } | undefined, form: FormData): Promise<{ error?: string }> {
  const key = await clientKey("login");
  if (await rateLimited(key, 5, 15 * 60)) {
    return { error: "Demasiadas tentativas. Tenta novamente daqui a 15 minutos." };
  }
  const password = String(form.get("password") ?? "");
  let ok = false;
  try {
    ok = password.length > 0 && password.length < 512 && (await checkPassword(password));
  } catch (e) {
    console.error(e);
    return { error: "Configuração de autenticação em falta no servidor (ADMIN_PASSWORD_HASH / AUTH_SECRET)." };
  }
  if (!ok) {
    await new Promise((r) => setTimeout(r, 400));
    return { error: "Password incorreta." };
  }
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

/* ------------------------------------------------------------ conteúdo */

export async function saveCollection(key: CollectionKey, items: unknown): Promise<ActionResult> {
  await requireAdmin();
  if (!Object.prototype.hasOwnProperty.call(COLLECTION_SCHEMAS, key)) return { ok: false, error: "Secção desconhecida." };

  const parsed = z.array(COLLECTION_SCHEMAS[key] as z.ZodTypeAny).safeParse(items);
  if (!parsed.success) return { ok: false, error: formatIssues(parsed.error) };

  const list = parsed.data as { id: string }[];
  const ids = new Set<string>();
  for (const it of list) {
    if (ids.has(it.id)) return { ok: false, error: `Identificador repetido: "${it.id}".` };
    ids.add(it.id);
  }
  if (key === "contexts" && list.length === 0) return { ok: false, error: "Tem de existir pelo menos um contexto." };

  const content = await getContent();
  let next: Content = { ...content, [key]: list };

  // Se contextos foram removidos, limpa as referências nos itens.
  if (key === "contexts") {
    const strip = <T extends { contexts: string[] }>(arr: T[]) =>
      arr.map((x) => ({ ...x, contexts: x.contexts.filter((c) => ids.has(c)) }));
    next = {
      ...next,
      experience: strip(next.experience),
      education: strip(next.education),
      proCertifications: strip(next.proCertifications),
      certifications: strip(next.certifications),
      projects: strip(next.projects),
      awards: strip(next.awards),
      skills: strip(next.skills),
      languages: strip(next.languages),
    };
  }

  await saveContent(next);
  refreshSite();
  return { ok: true, message: "Guardado." };
}

export async function saveProfile(profile: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = ProfileSchema.safeParse(profile);
  if (!parsed.success) return { ok: false, error: formatIssues(parsed.error) };
  const content = await getContent();
  // A foto só muda através de uploadPhoto/removePhoto.
  await saveContent({ ...content, profile: { ...parsed.data, photoUrl: content.profile.photoUrl } });
  refreshSite();
  return { ok: true, message: "Guardado." };
}

export async function uploadPhoto(form: FormData): Promise<ActionResult & { url?: string }> {
  await requireAdmin();
  const file = form.get("photo");
  // Blob em vez de File: "File" não é global no Node 18.
  if (!(file instanceof Blob) || file.size === 0) return { ok: false, error: "Escolhe uma imagem." };
  try {
    const url = await storePhoto(file);
    const content = await getContent();
    const old = content.profile.photoUrl;
    await saveContent({ ...content, profile: { ...content.profile, photoUrl: url } });
    await deletePhoto(old);
    refreshSite();
    return { ok: true, url, message: "Foto atualizada." };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro ao carregar a imagem." };
  }
}

export async function removePhoto(): Promise<ActionResult> {
  await requireAdmin();
  const content = await getContent();
  const old = content.profile.photoUrl;
  await saveContent({ ...content, profile: { ...content.profile, photoUrl: "" } });
  await deletePhoto(old);
  refreshSite();
  return { ok: true, message: "Foto removida." };
}

export async function savePrivateData(data: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = PrivateSchema.safeParse(data);
  if (!parsed.success) return { ok: false, error: formatIssues(parsed.error) };
  await storePrivate(parsed.data);
  return { ok: true, message: "Guardado." };
}

/** Exporta tudo (backup em JSON). */
export async function exportAll() {
  await requireAdmin();
  return { content: await getContent(), private: await getPrivate(), exportedAt: new Date().toISOString() };
}

/* ------------------------------------------------------------ mensagens */

export async function markMessage(id: string, read: boolean) {
  await requireAdmin();
  await messages.mark(String(id), Boolean(read));
  revalidatePath("/admin/messages");
}

export async function deleteMessage(id: string) {
  await requireAdmin();
  await messages.remove(String(id));
  revalidatePath("/admin/messages");
}
