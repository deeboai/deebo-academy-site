"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CircleDollarSign,
  FileSpreadsheet,
  GraduationCap,
  School,
  ScrollText,
  Users,
  UserSquare2,
  Workflow,
} from "lucide-react";

import { signOutAcademyUserAction } from "@/actions/academy-admin-auth";
import { ThemeToggle } from "@/components/theme/theme-toggle";

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

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.1),transparent_26%)]" />
      <div className="workspace-shell">
        <div className="workspace-frame overflow-hidden">
          <div className="border-b border-border/70 px-5 py-6 sm:px-7 lg:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="workspace-eyebrow">Deebo Academy</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-[2.4rem]">
                  {title}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {subtitle}
                </p>
              </div>

              <div className="grid gap-3 sm:min-w-[18rem]">
                <div className="rounded-[1.35rem] border border-border/70 bg-background/60 px-4 py-4">
                  <p className="record-meta-label">Signed in</p>
                  <p className="mt-2 truncate text-sm font-medium text-foreground">{userEmail}</p>
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
                href="/admin"
                className={`workspace-nav-link ${
                  pathname === "/admin" ? "workspace-nav-link-active" : ""
                }`}
              >
                <span>Overview</span>
              </Link>

              {academyAdminNavigation.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`workspace-nav-link ${active ? "workspace-nav-link-active" : ""}`}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <main className="px-5 py-6 sm:px-7 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
