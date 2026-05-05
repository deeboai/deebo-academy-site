import { notFound } from "next/navigation";

import { SectionCard } from "@/components/admin/section-card";
import { PortalShell } from "@/components/portal/portal-shell";
import { getCurriculumLesson, listCurriculumSubjects } from "@/lib/academy-data";
import { requireAcademyTutorUser } from "@/lib/auth/academy-portal";

type TutorCurriculumLessonPageProps = {
  params: Promise<{
    subject: string;
    lessonSlug: string;
  }>;
};

export default async function TutorCurriculumLessonPage({ params }: TutorCurriculumLessonPageProps) {
  const { subject, lessonSlug } = await params;
  const { user, tutor } = await requireAcademyTutorUser();
  const subjects = await listCurriculumSubjects();

  if (!subjects.includes(subject)) {
    notFound();
  }

  const lesson = await getCurriculumLesson(subject, lessonSlug).catch(() => null);

  if (!lesson) {
    notFound();
  }

  return (
    <PortalShell
      title={lesson.title}
      subtitle={`${lesson.unit} · ${lesson.topic}`}
      userEmail={user.email ?? tutor.email}
      homeLabel="Tutor Home"
      homeHref="/tutor"
      navigation={[
        { href: "/tutor/sessions", label: "Sessions" },
        { href: "/tutor/curriculum", label: "Curriculum" },
      ]}
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Lesson overview">
          <div className="space-y-4 text-sm text-muted-foreground">
            <p><span className="font-medium text-foreground">Objective:</span> {lesson.objective}</p>
            <p><span className="font-medium text-foreground">Prerequisites:</span> {lesson.prerequisites}</p>
            <p><span className="font-medium text-foreground">Tutor notes:</span> {lesson.tutorNotes}</p>
            <p><span className="font-medium text-foreground">Common mistakes:</span> {lesson.commonMistakes}</p>
          </div>
        </SectionCard>
        <SectionCard title="Execution">
          <div className="space-y-4 text-sm text-muted-foreground">
            <p><span className="font-medium text-foreground">In-session examples:</span> {lesson.inSessionExamples}</p>
            <p><span className="font-medium text-foreground">Practice problems:</span> {lesson.practiceProblems}</p>
            <p><span className="font-medium text-foreground">Homework:</span> {lesson.homework}</p>
            <p><span className="font-medium text-foreground">Answer key:</span> {lesson.answerKey}</p>
          </div>
        </SectionCard>
      </div>
    </PortalShell>
  );
}
