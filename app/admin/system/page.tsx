import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { SectionCard } from "@/components/admin/section-card";
import { requireAcademyAdminUser } from "@/lib/auth/academy-admin";
import { type AcademySystemCheckStatus, getAcademySystemHealth } from "@/lib/academy-system";

function getSystemStatusClasses(status: AcademySystemCheckStatus) {
  switch (status) {
    case "ok":
      return "border-emerald-500/30 bg-emerald-500/10 text-foreground";
    case "warning":
      return "border-amber-500/30 bg-amber-500/10 text-foreground";
    case "error":
      return "border-rose-500/30 bg-rose-500/10 text-foreground";
    default:
      return "border-border/70 bg-background/60 text-foreground";
  }
}

function getSystemStatusLabel(status: AcademySystemCheckStatus) {
  switch (status) {
    case "ok":
      return "Healthy";
    case "warning":
      return "Needs Action";
    case "error":
      return "Blocked";
    default:
      return "Unknown";
  }
}

export default async function AcademyAdminSystemPage() {
  const user = await requireAcademyAdminUser();
  const sections = await getAcademySystemHealth();

  return (
    <AdminShell
      title="System Health"
      subtitle="Check environment wiring, Supabase dependencies, and the SQL steps still required before production rollout."
      userEmail={user.email ?? "Authenticated user"}
    >
      <div className="grid gap-6">
        <SectionCard
          title="Operator Checklist"
          description="Use the focused rollout checklist while applying SQL and env changes outside the app."
          action={
            <Link href="/admin/access" className="secondary-button px-4 py-2">
              Open access
            </Link>
          }
        >
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>Run the pending SQL in Supabase before trusting the new access and authorization code.</p>
            <p>Set invite, email, payment, and calendar env values before enabling those workflows operationally.</p>
            <p>
              The written checklist lives in{" "}
              <span className="font-mono text-foreground">docs/ACADEMY_OPERATOR_CHECKLIST.md</span>.
            </p>
          </div>
        </SectionCard>

        {sections.map((section) => (
          <SectionCard
            key={section.title}
            title={section.title}
            description={section.description}
          >
            <div className="space-y-4">
              {section.checks.map((check) => (
                <article
                  key={check.id}
                  className="rounded-[1.35rem] border border-border/70 bg-background/45 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h4 className="text-base font-semibold text-foreground">{check.label}</h4>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {check.detail}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${getSystemStatusClasses(check.status)}`}
                    >
                      {getSystemStatusLabel(check.status)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </SectionCard>
        ))}
      </div>
    </AdminShell>
  );
}
