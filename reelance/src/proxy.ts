import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy (ex-middleware) : redirige vers la connexion les pages privées sans cookie de session.
 * La vérification réelle (session valide, rôle) est faite côté serveur dans les layouts.
 */
const PROTECTED_PREFIXES = ["/tableau-de-bord", "/admin", "/commander", "/paiement"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isProtected && !request.cookies.has("rl_session")) {
    // Domaine public reconstruit depuis les en-têtes du proxy (Nginx, aperçu…), sinon celui de la requête.
    const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || request.headers.get("host") || request.nextUrl.host;
    const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || request.nextUrl.protocol.replace(":", "");
    const url = new URL(`/connexion?suivant=${encodeURIComponent(pathname + search)}`, `${proto}://${host}`);
    return NextResponse.redirect(url);
  }

  const headers = new Headers(request.headers);
  headers.set("x-pathname", pathname + search);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.svg|brand/|robots.txt).*)"],
};
