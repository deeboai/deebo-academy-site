import Link from "next/link";

import { SectionCard } from "@/components/admin/section-card";
import { PortalShell } from "@/components/portal/portal-shell";
import { getAcademySessionsByParentId } from "@/lib/academy-data";
import { requireAcademyParentUser } from "@/lib/auth/academy-portal";

export default async function ParentSessionsPage() {
  const { user, parent } = await requireAcademyParentUser();
  const sessions = await getAcademySessionsByParentId(parent.id);

  return (
    <PortalShell
      title="Sessions"
      subtitle="Only validated notes and currently visible recordings are surfaced through the parent portal."
      userEmail={user.email ?? parent.email}
      homeLabel="Portal Home"
      homeHref="/parent"
      navigation={[
        { href: "/parent/students", label: "Students" },
        { href: "/parent/sessions", label: "Sessions" },
        { href: "/parent/payments", label: "Payments" },
      ]}
    >
      <SectionCard title="Session list">
        <div className="space-y-4">
          {sessions.map((session) => (
            <article key={session.id} className="record-row">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="workspace-eyebrow">Session</p>
                  <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground">{session.subject}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {session.course_name || "Course name pending"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {new Date(session.starts_at).toLocaleString()}
                  </p>
                </div>
                <Link href={`/parent/sessions/${session.id}`} className="secondary-button px-4 py-2">
                  Open
                </Link>
              </div>
            </article>
          ))}
        </div>
      </SectionCard>
    </PortalShell>
  );
}
