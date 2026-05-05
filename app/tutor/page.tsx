import { SectionCard } from "@/components/admin/section-card";
import { PortalShell } from "@/components/portal/portal-shell";
import { getAcademySessionsByTutorId } from "@/lib/academy-data";
import { requireAcademyTutorUser } from "@/lib/auth/academy-portal";

export default async function TutorHomePage() {
  const { user, tutor } = await requireAcademyTutorUser();
  const sessions = await getAcademySessionsByTutorId(tutor.id);

  return (
    <PortalShell
      title="Tutor Portal"
      subtitle="Review assigned sessions, student context, note status, and curriculum resources from one workspace."
      userEmail={user.email ?? tutor.email}
      homeLabel="Tutor Home"
      homeHref="/tutor"
      navigation={[
        { href: "/tutor/sessions", label: "Sessions" },
        { href: "/tutor/curriculum", label: "Curriculum" },
      ]}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard title="Assigned sessions">
          <p className="text-3xl font-semibold text-foreground">{sessions.length}</p>
        </SectionCard>
        <SectionCard title="Upcoming work">
          <p className="text-sm text-muted-foreground">
            Use the sessions area to submit notes and the curriculum area to anchor lesson structure.
          </p>
        </SectionCard>
      </div>
    </PortalShell>
  );
}
