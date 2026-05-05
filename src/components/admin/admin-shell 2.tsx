"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CircleDollarSign,
  FileSpreadsheet,
  GraduationCap,
  Menu,
  PanelsTopLeft,
  School,
  ScrollText,
  Users,
  UserSquare2,
  Workflow,
} from "lucide-react";
import { useState } from "react";

import { signOutAcademyAdminAction } from "@/actions/academy-admin-auth";

const academyAdminNavigation = [
  {
    href: "/admin/intake",
    label: "Intake",
    icon: Workflow,
  },
  {
    href: "/admin/parents",
    label: "Parents",
    icon: Users,
  },
  {
    href: "/admin/students",
    label: "Students",
    icon: GraduationCap,
  },
  {
    href: "/admin/tutors",
    label: "Tutors",
    icon: UserSquare2,
  },
  {
    href: "/admin/sessions",
    label: "Sessions",
    icon: School,
  },
  {
    href: "/admin/payments",
    label: "Payments",
    icon: CircleDollarSign,
  },
  {
    href: "/admin/session-notes",
    label: "Session Notes",
    icon: ScrollText,
  },
  {
    href: "/admin/placement",
    label: "Placement",
    icon: FileSpreadsheet,
  },
] as const;

type AdminShellProps = {
  title: string;
  subtitle: string;
  userEmail: string;
  children: React.ReactNode;
};

export function AdminShell({
  title,
  subtitle,
  userEmail,
  children,
}: AdminShellProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.1),transparent_26%)]" />
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-border/70 bg-card/95 p-6 backdrop-blur-xl transition-transform duration-300 lg:static lg:translate-x-0 ${
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/75">
                Deebo Academy
              </p>
              <h1 className="mt-3 text-2xl font-semibold text-foreground">Academy OS</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Intake-first tutoring operations with administrative review, fit decisions, and
                student records built around the actual course.
              </p>
            </div>

            <nav className="mt-10 space-y-2">
              <Link
                href="/admin"
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors ${
                  pathname === "/admin"
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <PanelsTopLeft className="h-4 w-4" />
                <span>Admin Home</span>
              </Link>

              {academyAdminNavigation.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto rounded-3xl border border-border/70 bg-background/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                Signed in
              </p>
              <p className="mt-2 truncate text-sm font-medium text-foreground">{userEmail}</p>
              <form action={signOutAcademyAdminAction} className="mt-4">
                <button
                  type="submit"
                  className="w-full rounded-xl border border-border/80 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="inline-flex rounded-xl border border-border/70 p-2 text-muted-foreground lg:hidden"
                  onClick={() => setIsMobileOpen((current) => !current)}
                  aria-label="Toggle Academy admin navigation"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                </div>
              </div>
            </div>
          </header>

          {isMobileOpen ? (
            <button
              type="button"
              className="fixed inset-0 z-30 bg-background/60 backdrop-blur-sm lg:hidden"
              onClick={() => setIsMobileOpen(false)}
              aria-label="Close Academy admin navigation"
            />
          ) : null}

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
