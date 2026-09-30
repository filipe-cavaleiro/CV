import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const ALLOWED = ["image/jpeg", "image/png"];
const MAX_BYTES = 4 * 1024 * 1024;

/** Verifica a assinatura real do ficheiro (não confiar no mime type enviado). */
function sniff(buf: Buffer): "jpg" | "png" | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  return null;
}

export async function storePhoto(file: Blob): Promise<string> {
  if (!ALLOWED.includes(file.type)) throw new Error("Formato não suportado — usa JPG ou PNG.");
  if (file.size > MAX_BYTES) throw new Error("Imagem demasiado grande (máx. 4 MB).");
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = sniff(buf);
  if (!ext) throw new Error("O ficheiro não parece ser uma imagem JPG/PNG válida.");
  const name = `photo-${randomUUID()}.${ext}`;
  const contentType = ext === "jpg" ? "image/jpeg" : "image/png";

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`cv/${name}`, buf, { access: "public", contentType });
    return blob.url;
  }
  if (process.env.VERCEL) throw new Error("BLOB_READ_WRITE_TOKEN não está definido. Liga o Vercel Blob ao projeto.");

  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), buf);
  return `/uploads/${name}`;
}

export async function deletePhoto(url: string) {
  if (!url) return;
  try {
    if (url.startsWith("https://") && process.env.BLOB_READ_WRITE_TOKEN) {
      const { del } = await import("@vercel/blob");
      await del(url);
    } else if (/^\/uploads\/photo-[\w-]+\.(jpg|png)$/.test(url)) {
      await fs.unlink(path.join(process.cwd(), "public", url));
    }
  } catch (e) {
    console.warn("[photo] não foi possível apagar", url, e);
  }
}

/** Lê a foto como buffer (para o PDF). */
export async function readPhoto(url: string): Promise<{ data: Buffer; format: "jpg" | "png" } | null> {
  if (!url) return null;
  try {
    let buf: Buffer;
    if (/^\/uploads\/photo-[\w-]+\.(jpg|png)$/.test(url)) {
      buf = await fs.readFile(path.join(process.cwd(), "public", url));
    } else if (/^https:\/\/[\w.-]+\.public\.blob\.vercel-storage\.com\//.test(url)) {
      const res = await fetch(url);
      if (!res.ok) return null;
      buf = Buffer.from(await res.arrayBuffer());
    } else {
      return null;
    }
    const format = sniff(buf);
    return format ? { data: buf, format } : null;
  } catch {
    return null;
  }
}
