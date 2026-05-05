import Link from "next/link";
import { notFound } from "next/navigation";

import { SectionCard } from "@/components/admin/section-card";
import { PortalShell } from "@/components/portal/portal-shell";
import { listCurriculumLessonsBySubject, listCurriculumSubjects } from "@/lib/academy-data";
import { requireAcademyTutorUser } from "@/lib/auth/academy-portal";

type TutorCurriculumSubjectPageProps = {
  params: Promise<{
    subject: string;
  }>;
};

export default async function TutorCurriculumSubjectPage({ params }: TutorCurriculumSubjectPageProps) {
  const { subject } = await params;
  const { user, tutor } = await requireAcademyTutorUser();
  const subjects = await listCurriculumSubjects();

  if (!subjects.includes(subject)) {
    notFound();
  }

  const lessons = await listCurriculumLessonsBySubject(subject);

  return (
    <PortalShell
      title={subject.replace(/-/g, " ")}
      subtitle="Choose a lesson to see objectives, examples, homework, and answer keys."
      userEmail={user.email ?? tutor.email}
      homeLabel="Tutor Home"
      homeHref="/tutor"
      navigation={[
        { href: "/tutor/sessions", label: "Sessions" },
        { href: "/tutor/curriculum", label: "Curriculum" },
      ]}
    >
      <SectionCard title="Lessons">
        <div className="space-y-4">
          {lessons.map((lesson) => (
            <article key={lesson.slug} className="rounded-2xl border border-border/70 bg-background/50 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-foreground">{lesson.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{lesson.unit} · {lesson.topic}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{lesson.objective}</p>
                </div>
                <Link href={`/tutor/curriculum/${subject}/${lesson.slug}`} className="secondary-button px-4 py-2">
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
