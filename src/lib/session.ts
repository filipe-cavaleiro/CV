// Sem dependências de Node — é usado também no middleware (edge runtime).
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "cv_admin";
export const SESSION_TTL_SEC = 60 * 60 * 12;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET em falta ou demasiado curto (mín. 32 caracteres).");
  return new TextEncoder().encode(s);
}

export async function signSession() {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("admin")
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SEC}s`)
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    return payload.sub === "admin" && payload.role === "admin";
  } catch {
    return false;
  }
}
