"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOutAcademyAdminAction } from "@/actions/academy-admin-auth";

type PortalNavigationItem = {
  href: string;
  label: string;
};

type PortalShellProps = {
  title: string;
  subtitle: string;
  userEmail: string;
  homeLabel: string;
  homeHref: string;
  navigation: PortalNavigationItem[];
  children: React.ReactNode;
};

export function PortalShell({
  title,
  subtitle,
  userEmail,
  homeLabel,
  homeHref,
  navigation,
  children,
}: PortalShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.08),transparent_24%)]" />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.6)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary/80">
                Deebo Academy
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
            </div>

            <div className="rounded-3xl border border-border/70 bg-background/60 px-4 py-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{userEmail}</p>
              <form action={signOutAcademyAdminAction} className="mt-3">
                <button type="submit" className="secondary-button px-4 py-2">
                  Sign out
                </button>
              </form>
            </div>
          </div>

          <nav className="flex flex-wrap gap-2">
            <Link
              href={homeHref}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                pathname === homeHref
                  ? "bg-primary text-primary-foreground"
                  : "border border-border/70 text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {homeLabel}
            </Link>
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                    ? "bg-primary text-primary-foreground"
                    : "border border-border/70 text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}
