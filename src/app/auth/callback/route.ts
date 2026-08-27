import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const nextPath = request.nextUrl.searchParams.get("next");
  const destination =
    nextPath === "/reset-password" || nextPath === "/accept-invite" ? nextPath : "/login";

  if (!code) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const errorType = destination === "/accept-invite" ? "invite" : "recovery";
    return NextResponse.redirect(new URL(`/login?error=${errorType}`, request.url));
  }

  return NextResponse.redirect(new URL(destination, request.url));
}
