import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

function appBaseUrl(requestUrl: URL) {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) {
    try {
      const parsed = new URL(configured);
      if (parsed.protocol === "https:" || parsed.hostname === "localhost") return parsed.origin;
    } catch {
      // Fall back to the callback origin when a deployment URL is malformed.
    }
  }
  return requestUrl.origin;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const baseUrl = appBaseUrl(requestUrl);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const code = requestUrl.searchParams.get("code");
  const oauthError = requestUrl.searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(new URL("/login?error=oauth_denied", baseUrl));
  }
  if (!url || !key || !code) {
    return NextResponse.redirect(new URL("/login?error=auth_setup", baseUrl));
  }

  let response = NextResponse.redirect(new URL("/chat?auth=success", baseUrl));
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.redirect(new URL("/chat?auth=success", baseUrl));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options as never));
      },
    },
  });
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/login?error=auth_callback", baseUrl));
  }
  return response;
}
