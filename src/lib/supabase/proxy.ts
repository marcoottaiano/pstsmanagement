import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import type { Database } from "@/types/database.types";

import { getPublicSupabaseConfig } from "./config";

function redirectWithCookies(url: URL, sourceResponse: NextResponse): NextResponse {
  const redirectResponse = NextResponse.redirect(url);

  sourceResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });
  ["Cache-Control", "Expires", "Pragma"].forEach((headerName) => {
    const value = sourceResponse.headers.get(headerName);
    if (value) {
      redirectResponse.headers.set(headerName, value);
    }
  });

  return redirectResponse;
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });
  const { url, publishableKey } = getPublicSupabaseConfig();
  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headersToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headersToSet).forEach(([name, value]) => {
          response.headers.set(name, value);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  const isAuthenticated = !error && Boolean(data?.claims.sub);
  const pathname = request.nextUrl.pathname;

  if (!isAuthenticated && pathname.startsWith("/dashboard")) {
    return redirectWithCookies(new URL("/login", request.url), response);
  }

  if (isAuthenticated && pathname === "/login") {
    return redirectWithCookies(new URL("/dashboard", request.url), response);
  }

  if (pathname === "/") {
    const destination = isAuthenticated ? "/dashboard" : "/login";
    return redirectWithCookies(new URL(destination, request.url), response);
  }

  return response;
}
