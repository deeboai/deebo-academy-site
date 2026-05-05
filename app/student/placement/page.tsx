import Link from "next/link";

import { EmptyState } from "@/components/admin/empty-state";
import { SectionCard } from "@/components/admin/section-card";
import { PortalShell } from "@/components/portal/portal-shell";
import {
  getAcademyPlacementAttemptsByStudentId,
  listAcademyPlacementExams,
} from "@/lib/academy-data";
import { requireAcademyStudentUser } from "@/lib/auth/academy-portal";

export default async function StudentPlacementPage() {
  const { user, student } = await requireAcademyStudentUser();
  const [attempts, exams] = await Promise.all([
    getAcademyPlacementAttemptsByStudentId(student.id),
    listAcademyPlacementExams(),
  ]);

  return (
    <PortalShell
      title="Placement"
      subtitle="Assigned placement exams appear here so the student can start and submit them from the portal."
      userEmail={user.email ?? "Authenticated student"}
      homeLabel="Student Home"
      homeHref="/student"
      navigation={[
        { href: "/student/placement", label: "Placement" },
        { href: "/student/sessions", label: "Sessions" },
      ]}
    >
      <SectionCard title="Assigned placement exams">
        {attempts.length ? (
          <div className="space-y-4">
            {attempts.map((attempt) => {
              const exam = exams.find((candidate) => candidate.id === attempt.exam_id);

              return (
                <article key={attempt.id} className="record-row">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="workspace-eyebrow">Placement</p>
                      <p className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                        {exam?.name || "Placement exam"}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Status: {attempt.status}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Score: {attempt.total_score ?? "Pending review"}
                      </p>
                    </div>

                    <Link href={`/student/placement/${attempt.id}`} className="secondary-button px-4 py-2">
                      Open
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No placement exams assigned"
            description="Placement work will appear here when an Academy administrator assigns it to this student record."
          />
        )}
      </SectionCard>
    </PortalShell>
  );
}
