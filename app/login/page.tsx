import { redirect } from "next/navigation";
import { ArrowRight, LockKeyhole, LogIn } from "lucide-react";
import Link from "next/link";

import { signInAcademyUserAction, signOutAcademyUserAction } from "@/actions/academy-admin-auth";
import {
  getAcademyRedirectPathForRole,
  getAcademyRoleLabel,
  getOptionalAcademyAccessForCurrentUser,
  getOptionalAuthenticatedAcademyUser,
} from "@/lib/auth/academy-access";
import { hasPublicSupabaseEnv } from "@/lib/env";
import { ThemeToggle } from "@/components/theme/theme-toggle";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    next?: string;
  }>;
};

export default async function AcademyLoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const authenticatedUser = await getOptionalAuthenticatedAcademyUser();
  const currentAccess = await getOptionalAcademyAccessForCurrentUser();

  if (currentAccess?.accesses.length === 1) {
    redirect(getAcademyRedirectPathForRole(currentAccess.accesses[0].role, params.next));
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.1),transparent_28%)]" />
      <div className="container flex min-h-screen items-center justify-center py-16">
        <div className="w-full max-w-5xl rounded-[2rem] border border-border/80 bg-card/90 p-6 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.38)] sm:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex rounded-2xl border border-primary/25 bg-primary/10 p-3 text-primary">
                <LockKeyhole className="h-6 w-6" />
              </div>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.32em] text-primary/80">
                Deebo Academy
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Academy Portal
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Sign in to continue.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
                <Link href="/book" className="secondary-button px-4 py-2">
                  Public site
                </Link>
                <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary">
                  Back to Academy overview
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="w-full max-w-md rounded-[1.75rem] border border-border/70 bg-background/65 p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-foreground">Sign in</h2>
                <ThemeToggle />
              </div>

              {params.error ? (
                <div className="mt-5 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground">
                  {params.error}
                </div>
              ) : null}

              {!hasPublicSupabaseEnv ? (
                <div className="mt-5 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-4 text-sm text-foreground">
                  <p className="font-medium">Supabase login is not configured yet.</p>
                  <p className="mt-2 text-muted-foreground">
                    Add <span className="font-mono text-foreground">NEXT_PUBLIC_SUPABASE_URL</span>{" "}
                    and <span className="font-mono text-foreground">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>{" "}
                    to <span className="font-mono text-foreground">.env.local</span>, then restart
                    the app.
                  </p>
                </div>
              ) : null}

              {authenticatedUser?.email && currentAccess?.accesses.length ? (
                <div className="mt-5 rounded-2xl border border-border/70 bg-card/80 px-4 py-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{authenticatedUser.email}</p>
                  <p className="mt-2">Choose where you want to continue.</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {currentAccess.accesses.map((access) => (
                      <Link
                        key={access.role}
                        href={getAcademyRedirectPathForRole(access.role, params.next)}
                        className="secondary-button px-4 py-2"
                      >
                        {getAcademyRoleLabel(access.role)} Portal
                      </Link>
                    ))}
                  </div>
                  <form action={signOutAcademyUserAction} className="mt-4">
                    <button type="submit" className="secondary-button px-4 py-2">
                      Sign out
                    </button>
                  </form>
                </div>
              ) : null}

              {authenticatedUser?.email && !currentAccess ? (
                <div className="mt-5 rounded-2xl border border-border/70 bg-card/80 px-4 py-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{authenticatedUser.email}</p>
                  <p className="mt-2">This account is not set up for portal access yet.</p>
                  <form action={signOutAcademyUserAction} className="mt-4">
                    <button type="submit" className="secondary-button px-4 py-2">
                      Sign out
                    </button>
                  </form>
                </div>
              ) : null}

              <form action={signInAcademyUserAction} className="mt-6 space-y-5">
                <input type="hidden" name="next" value={params.next ?? ""} />
                <div>
                  <label htmlFor="academy-login-email" className="field-label">
                    Email
                  </label>
                  <input
                    id="academy-login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    className="field-input"
                    placeholder="family@domain.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="academy-login-password" className="field-label">
                    Password
                  </label>
                  <input
                    id="academy-login-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    className="field-input"
                    placeholder="••••••••"
                    required
                  />
                </div>

                {!currentAccess?.accesses.length ? (
                  <button
                    type="submit"
                    className="primary-button w-full justify-center gap-2 py-3.5 text-base"
                    disabled={!hasPublicSupabaseEnv}
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Sign in to your portal</span>
                  </button>
                ) : null}
              </form>

              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                Use the email and password connected to your Academy account.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
