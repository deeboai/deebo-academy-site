import Link from "next/link";

import { SectionCard } from "@/components/admin/section-card";
import { PortalShell } from "@/components/portal/portal-shell";
import { getAcademySessionsByTutorId } from "@/lib/academy-data";
import { requireAcademyTutorUser } from "@/lib/auth/academy-portal";

export default async function TutorSessionsPage() {
  const { user, tutor } = await requireAcademyTutorUser();
  const sessions = await getAcademySessionsByTutorId(tutor.id);

  return (
    <PortalShell
      title="Tutor Sessions"
      subtitle="Assigned sessions stay visible here together with the note submission route."
      userEmail={user.email ?? tutor.email}
      homeLabel="Tutor Home"
      homeHref="/tutor"
      navigation={[
        { href: "/tutor/sessions", label: "Sessions" },
        { href: "/tutor/curriculum", label: "Curriculum" },
      ]}
    >
      <SectionCard title="Assigned sessions">
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
                <div className="flex gap-2">
                  <Link href={`/tutor/sessions/${session.id}`} className="secondary-button px-4 py-2">
                    Open
                  </Link>
                  <Link href={`/tutor/sessions/${session.id}/notes`} className="secondary-button px-4 py-2">
                    Notes
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </SectionCard>
    </PortalShell>
  );
}
