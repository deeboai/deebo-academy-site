import Link from "next/link";

import { SectionCard } from "@/components/admin/section-card";
import { PortalShell } from "@/components/portal/portal-shell";
import { listCurriculumSubjects } from "@/lib/academy-data";
import { requireAcademyTutorUser } from "@/lib/auth/academy-portal";

export default async function TutorCurriculumPage() {
  const { user, tutor } = await requireAcademyTutorUser();
  const subjects = await listCurriculumSubjects();

  return (
    <PortalShell
      title="Curriculum"
      subtitle="Curriculum lessons help tutors stay structured instead of improvising every session."
      userEmail={user.email ?? tutor.email}
      homeLabel="Tutor Home"
      homeHref="/tutor"
      navigation={[
        { href: "/tutor/sessions", label: "Sessions" },
        { href: "/tutor/curriculum", label: "Curriculum" },
      ]}
    >
      <SectionCard title="Subjects">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {subjects.map((subject) => (
            <Link
              key={subject}
              href={`/tutor/curriculum/${subject}`}
              className="rounded-2xl border border-border/70 bg-background/50 px-4 py-5 text-sm font-medium capitalize text-foreground hover:border-primary/40 hover:text-primary"
            >
              {subject.replace(/-/g, " ")}
            </Link>
          ))}
        </div>
      </SectionCard>
    </PortalShell>
  );
}
