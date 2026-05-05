import { notFound } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { SectionCard } from "@/components/admin/section-card";
import {
  getAcademyPlacementAttemptById,
  getAcademyPlacementExamById,
  getAcademyPlacementQuestionsByExamId,
  getAcademyPlacementResponsesByAttemptId,
} from "@/lib/academy-data";
import { requireAcademyAdminUser } from "@/lib/auth/academy-admin";
import { reviewAcademyPlacementAttemptAction } from "@/actions/academy-os-admin";

type PlacementAttemptDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AcademyAdminPlacementAttemptDetailPage({ params }: PlacementAttemptDetailPageProps) {
  const { id } = await params;
  const user = await requireAcademyAdminUser();
  const attempt = await getAcademyPlacementAttemptById(id);

  if (!attempt) {
    notFound();
  }

  const exam = attempt.exam_id ? await getAcademyPlacementExamById(attempt.exam_id) : null;
  const [questions, responses] = await Promise.all([
    attempt.exam_id ? getAcademyPlacementQuestionsByExamId(attempt.exam_id) : Promise.resolve([]),
    getAcademyPlacementResponsesByAttemptId(attempt.id),
  ]);

  return (
    <AdminShell
      title={exam?.name || "Placement attempt"}
      subtitle="Review autograded and AI-assisted responses, then store the final admin recommendation."
      userEmail={user.email ?? "Authenticated user"}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <SectionCard title="Responses">
          <div className="space-y-4">
            {questions.map((question) => {
              const response = responses.find((candidate) => candidate.question_id === question.id);

              return (
                <article key={question.id} className="rounded-2xl border border-border/70 bg-background/50 p-4">
                  <p className="font-medium text-foreground">{question.topic}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{question.question_text}</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">
                    Response: {response?.response || "No response submitted"}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Auto score: {response?.auto_score ?? "n/a"} · AI score: {response?.ai_score ?? "n/a"} · Confidence: {response?.ai_confidence ?? "n/a"}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {response?.ai_feedback || "No AI feedback recorded."}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Missing concepts: {response?.ai_missing_concepts?.join(", ") || "Not captured"}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Recommended next topic: {response?.ai_recommended_next_topic || "Not captured"}
                  </p>
                </article>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title="Review outcome">
          <form action={reviewAcademyPlacementAttemptAction} className="space-y-4">
            <input type="hidden" name="attempt_id" value={attempt.id} />
            <div>
              <label className="field-label">Total score</label>
              <input
                name="total_score"
                defaultValue={attempt.total_score ?? ""}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">AI recommendation</label>
              <textarea
                rows={5}
                readOnly
                value={attempt.ai_recommendation ?? ""}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Admin recommendation</label>
              <textarea
                name="admin_recommendation"
                rows={6}
                defaultValue={attempt.admin_recommendation ?? ""}
                className="field-input"
              />
            </div>
            <button type="submit" className="primary-button">
              Save review
            </button>
          </form>
        </SectionCard>
      </div>
    </AdminShell>
  );
}
