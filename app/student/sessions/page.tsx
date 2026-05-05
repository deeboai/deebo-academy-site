import Link from "next/link";

import { EmptyState } from "@/components/admin/empty-state";
import { SectionCard } from "@/components/admin/section-card";
import { PortalShell } from "@/components/portal/portal-shell";
import { getAcademySessionsByStudentId } from "@/lib/academy-data";
import { requireAcademyStudentUser } from "@/lib/auth/academy-portal";

export default async function StudentSessionsPage() {
  const { user, student } = await requireAcademyStudentUser();
  const sessions = await getAcademySessionsByStudentId(student.id);

  return (
    <PortalShell
      title="Sessions"
      subtitle="Upcoming and completed tutoring sessions tied to this student record appear here."
      userEmail={user.email ?? "Authenticated student"}
      homeLabel="Student Home"
      homeHref="/student"
      navigation={[
        { href: "/student/placement", label: "Placement" },
        { href: "/student/sessions", label: "Sessions" },
      ]}
    >
      <SectionCard title="Session list">
        {sessions.length ? (
          <div className="space-y-4">
            {sessions.map((session) => (
              <article key={session.id} className="record-row">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="workspace-eyebrow">Session</p>
                    <p className="mt-2 text-xl font-semibold tracking-tight text-foreground">{session.subject}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {session.course_name || "Course name pending"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {new Date(session.starts_at).toLocaleString()} · {session.status}
                    </p>
                  </div>
                  <Link href={`/student/sessions/${session.id}`} className="secondary-button px-4 py-2">
                    Open
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No sessions yet"
            description="Sessions will appear here once they are created by the Academy team."
          />
        )}
      </SectionCard>
    </PortalShell>
  );
}
