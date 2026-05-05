"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOutAcademyUserAction } from "@/actions/academy-admin-auth";
import { ThemeToggle } from "@/components/theme/theme-toggle";

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
      <div className="workspace-shell">
        <div className="workspace-frame overflow-hidden">
          <div className="border-b border-border/70 px-5 py-6 sm:px-7 lg:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="workspace-eyebrow">Deebo Academy</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-[2.3rem]">
                  {title}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {subtitle}
                </p>
              </div>

              <div className="grid gap-3 sm:min-w-[18rem]">
                <div className="rounded-[1.35rem] border border-border/70 bg-background/60 px-4 py-4 text-sm text-muted-foreground">
                  <p className="record-meta-label">Signed in</p>
                  <p className="mt-2 truncate font-medium text-foreground">{userEmail}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <ThemeToggle />
                  <form action={signOutAcademyUserAction}>
                    <button type="submit" className="secondary-button px-4 py-2">
                      Sign out
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <nav className="mt-6 flex flex-wrap gap-2">
              <Link
                href={homeHref}
                className={`workspace-nav-link ${
                  pathname === homeHref ? "workspace-nav-link-active" : ""
                }`}
              >
                {homeLabel}
              </Link>
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`workspace-nav-link ${
                    pathname === item.href || pathname.startsWith(`${item.href}/`)
                      ? "workspace-nav-link-active"
                      : ""
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="px-5 py-6 sm:px-7 lg:px-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
