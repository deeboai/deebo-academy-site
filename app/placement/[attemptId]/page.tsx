import { notFound } from "next/navigation";

import { SectionCard } from "@/components/admin/section-card";
import { PlacementAttemptForm } from "@/components/placement/placement-attempt-form";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  getAcademyPlacementAttemptById,
  getAcademyPlacementExamById,
  getAcademyPlacementQuestionsByExamId,
} from "@/lib/academy-data";

type PlacementAttemptPageProps = {
  params: Promise<{
    attemptId: string;
  }>;
  searchParams?: Promise<{
    token?: string;
    error?: string;
  }>;
};

export default async function PlacementAttemptPage({ params, searchParams }: PlacementAttemptPageProps) {
  const { attemptId } = await params;
  const query = (await searchParams) ?? {};
  const attempt = await getAcademyPlacementAttemptById(attemptId);

  if (!attempt || !query.token || query.token !== attempt.access_token) {
    notFound();
  }

  const exam = attempt.exam_id ? await getAcademyPlacementExamById(attempt.exam_id) : null;

  if (!exam) {
    notFound();
  }

  const questions = await getAcademyPlacementQuestionsByExamId(exam.id);

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-16">
        <SectionCard title={exam.name} description={exam.description || "Complete the placement exam before the next Academy review step."}>
          <div className="mb-6 flex justify-end">
            <ThemeToggle />
          </div>

          {query.error ? (
            <div className="mb-6 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground">
              {query.error}
            </div>
        ) : null}

          <PlacementAttemptForm attemptId={attempt.id} token={query.token} questions={questions} />
        </SectionCard>
      </div>
    </div>
  );
}
