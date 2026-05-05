import { notFound } from "next/navigation";

import { SectionCard } from "@/components/admin/section-card";
import { PlacementAttemptForm } from "@/components/placement/placement-attempt-form";
import { PortalShell } from "@/components/portal/portal-shell";
import {
  getAcademyPlacementAttemptById,
  getAcademyPlacementExamById,
  getAcademyPlacementQuestionsByExamId,
} from "@/lib/academy-data";
import { requireAcademyStudentUser } from "@/lib/auth/academy-portal";

type StudentPlacementAttemptPageProps = {
  params: Promise<{
    attemptId: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function StudentPlacementAttemptPage({
  params,
  searchParams,
}: StudentPlacementAttemptPageProps) {
  const { attemptId } = await params;
  const query = (await searchParams) ?? {};
  const { user, student } = await requireAcademyStudentUser();
  const attempt = await getAcademyPlacementAttemptById(attemptId);

  if (!attempt || attempt.student_id !== student.id) {
    notFound();
  }

  const exam = attempt.exam_id ? await getAcademyPlacementExamById(attempt.exam_id) : null;

  if (!exam) {
    notFound();
  }

  const questions = await getAcademyPlacementQuestionsByExamId(exam.id);

  return (
    <PortalShell
      title={exam.name}
      subtitle="Complete the assigned placement work from the student portal. The final recommendation is still reviewed by an Academy administrator."
      userEmail={user.email ?? "Authenticated student"}
      homeLabel="Student Home"
      homeHref="/student"
      navigation={[
        { href: "/student/placement", label: "Placement" },
        { href: "/student/sessions", label: "Sessions" },
      ]}
    >
      <SectionCard title="Placement exam" description={exam.description || "Submit the exam once every question you want answered is complete."}>
        {query.error ? (
          <div className="mb-6 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground">
            {query.error}
          </div>
        ) : null}

        <PlacementAttemptForm
          attemptId={attempt.id}
          questions={questions}
          studentPortalMode
          successRedirect={`/student/placement/${attempt.id}/complete`}
          errorRedirect={`/student/placement/${attempt.id}`}
        />
      </SectionCard>
    </PortalShell>
  );
}
