import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { buildAcademyLoginPath } from "@/lib/auth/academy-access";
import { hasPublicSupabaseEnv } from "@/lib/env";

export async function GET(request: NextRequest) {
  const nextPath = request.nextUrl.searchParams.get("next");

  if (hasPublicSupabaseEnv) {
    const supabase = await getSupabaseServerClient();
    await supabase.auth.signOut();
  }

  const loginUrl = new URL(
    buildAcademyLoginPath("Your Academy session was revoked. Sign in again.", nextPath),
    request.url,
  );

  return NextResponse.redirect(loginUrl);
}
