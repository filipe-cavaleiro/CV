import "server-only";
import { createHash, scrypt, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_TTL_SEC, signSession, verifySession } from "./session";

function scryptAsync(pw: string, salt: Buffer, len: number) {
  return new Promise<Buffer>((resolve, reject) =>
    scrypt(pw, salt, len, { N: 16384, r: 8, p: 1 }, (err, key) => (err ? reject(err) : resolve(key))),
  );
}

export async function checkPassword(password: string): Promise<boolean> {
  const stored = process.env.ADMIN_PASSWORD_HASH ?? "";
  const [algo, saltB64, hashB64] = stored.split(":");
  if (algo !== "scrypt" || !saltB64 || !hashB64) {
    throw new Error("ADMIN_PASSWORD_HASH em falta ou inválido. Gera com: npm run hash-password");
  }
  const expected = Buffer.from(hashB64, "base64url");
  const actual = await scryptAsync(password, Buffer.from(saltB64, "base64url"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function startSession() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await signSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_SEC,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function isAdmin() {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value);
}

/** Usar no início de TODAS as server actions / páginas / rotas de administração. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

/** Identificador anónimo do cliente para rate limiting (hash do IP, nunca guardado em claro). */
export async function clientKey(scope: string) {
  const h = await headers();
  const ip = h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const digest = createHash("sha256").update(`${process.env.AUTH_SECRET ?? ""}:${ip}`).digest("base64url").slice(0, 24);
  return `${scope}:${digest}`;
}
