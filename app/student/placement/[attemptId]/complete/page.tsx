import { SectionCard } from "@/components/admin/section-card";
import { PortalShell } from "@/components/portal/portal-shell";
import { requireAcademyStudentUser } from "@/lib/auth/academy-portal";

export default async function StudentPlacementCompletePage() {
  const { user } = await requireAcademyStudentUser();

  return (
    <PortalShell
      title="Placement submitted"
      subtitle="The placement attempt has been received and is now waiting for review."
      userEmail={user.email ?? "Authenticated student"}
      homeLabel="Student Home"
      homeHref="/student"
      navigation={[
        { href: "/student/placement", label: "Placement" },
        { href: "/student/sessions", label: "Sessions" },
      ]}
    >
      <SectionCard
        title="Placement exam submitted"
        description="Multiple-choice responses are scored automatically. Free-response items still go through AI-assisted scoring and final Academy review."
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          Once the review is finished, Deebo Academy can use the result to recommend the right
          starting level or next step.
        </p>
      </SectionCard>
    </PortalShell>
  );
}
