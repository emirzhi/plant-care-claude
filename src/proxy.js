import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/auth/callback", "/offline"];

function isPublicPath(pathname) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  // API routes authenticate themselves and return a JSON 401 — they must NOT
  // be redirected to /login here. Two reasons: (1) /api/cron/push-digest is
  // called by Vercel Cron with a CRON_SECRET bearer token and no session
  // cookie, so a redirect would silently stop every digest from ever
  // running; (2) a redirect turns a fetch()'s expected JSON 401 into a 307
  // to an HTML page, which the client can't parse.
  if (pathname.startsWith("/api/")) return true;
  // Next.js internals, static assets, and PWA files must stay unauthenticated.
  if (pathname.startsWith("/_next")) return true;
  if (pathname === "/manifest.webmanifest") return true;
  if (pathname === "/sw.js") return true;
  if (pathname.startsWith("/icons")) return true;
  if (pathname === "/favicon.ico") return true;
  return false;
}

export async function proxy(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Required: this call refreshes the session and must not be skipped.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/plants", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons).*)",
  ],
};
