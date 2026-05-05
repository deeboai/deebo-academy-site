import { SectionCard } from "@/components/admin/section-card";
import { PortalShell } from "@/components/portal/portal-shell";
import {
  getAcademyPlacementAttemptsByStudentId,
  getAcademySessionsByStudentId,
} from "@/lib/academy-data";
import { requireAcademyStudentUser } from "@/lib/auth/academy-portal";

export default async function StudentHomePage() {
  const { user, student } = await requireAcademyStudentUser();
  const [sessions, placementAttempts] = await Promise.all([
    getAcademySessionsByStudentId(student.id),
    getAcademyPlacementAttemptsByStudentId(student.id),
  ]);
  const submittedPlacements = placementAttempts.filter((attempt) => attempt.status === "submitted");

  return (
    <PortalShell
      title="Student Portal"
      subtitle="Review placement work, upcoming sessions, and the tutoring context tied to your actual course."
      userEmail={user.email ?? "Authenticated student"}
      homeLabel="Student Home"
      homeHref="/student"
      navigation={[
        { href: "/student/placement", label: "Placement" },
        { href: "/student/sessions", label: "Sessions" },
      ]}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <SectionCard title="Placement attempts">
          <p className="text-3xl font-semibold text-foreground">{placementAttempts.length}</p>
        </SectionCard>
        <SectionCard title="Submitted placements">
          <p className="text-3xl font-semibold text-foreground">{submittedPlacements.length}</p>
        </SectionCard>
        <SectionCard title="Sessions">
          <p className="text-3xl font-semibold text-foreground">{sessions.length}</p>
        </SectionCard>
      </div>
    </PortalShell>
  );
}
