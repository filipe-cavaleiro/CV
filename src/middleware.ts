import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

function preferredLocale(req: NextRequest): "pt" | "en" {
  const saved = req.cookies.get("lang")?.value;
  if (saved === "pt" || saved === "en") return saved;
  const accept = req.headers.get("accept-language") ?? "";
  return /^\s*pt\b/i.test(accept) ? "pt" : "en";
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/") {
    return NextResponse.redirect(new URL(`/${preferredLocale(req)}`, req.url));
  }

  // Primeira barreira. As páginas, actions e rotas voltam a validar a sessão no servidor.
  const isAdminArea = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isAdminApi = pathname.startsWith("/api/admin");
  if (isAdminArea || isAdminApi) {
    const ok = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
    if (!ok) {
      if (isAdminApi) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*", "/api/admin/:path*"],
};
