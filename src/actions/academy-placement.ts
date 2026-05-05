"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  getAcademyPlacementAttemptById,
  getAcademyPlacementExamById,
  getAcademyPlacementQuestionsByExamId,
} from "@/lib/academy-data";
import { requireAcademyStudentUser } from "@/lib/auth/academy-portal";
import { scorePlacementFreeResponse } from "@/lib/placement-scoring";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

type PlacementSubmissionResult = {
  status: "success" | "error";
  message: string;
};

export async function submitAcademyPlacementAttemptAction(
  formData: FormData,
): Promise<PlacementSubmissionResult> {
  const attemptId = String(formData.get("attempt_id") ?? "").trim();
  const accessToken = String(formData.get("token") ?? "").trim();
  const studentPortalMode = String(formData.get("student_portal_mode") ?? "") === "true";

  if (!attemptId) {
    return {
      status: "error",
      message: "Missing placement attempt information.",
    };
  }

  const attempt = await getAcademyPlacementAttemptById(attemptId);

  if (!attempt) {
    return {
      status: "error",
      message: "This placement attempt was not found.",
    };
  }

  if (studentPortalMode) {
    const { student } = await requireAcademyStudentUser();

    if (attempt.student_id !== student.id) {
      return {
        status: "error",
        message: "This placement attempt is not assigned to the signed-in student.",
      };
    }
  } else if (!accessToken || attempt.access_token !== accessToken) {
    return {
      status: "error",
      message: "This placement link is not valid.",
    };
  }

  const exam = attempt.exam_id ? await getAcademyPlacementExamById(attempt.exam_id) : null;

  if (!exam) {
    return {
      status: "error",
      message: "The linked placement exam was not found.",
    };
  }

  const questions = await getAcademyPlacementQuestionsByExamId(exam.id);
  const supabase = getSupabaseServiceClient() as any;
  let totalScore = 0;

  for (const question of questions) {
    const responseValue = String(formData.get(`question_${question.id}`) ?? "").trim();

    if (!responseValue) {
      continue;
    }

    let autoScore: number | null = null;
    let aiScore: number | null = null;
    let aiFeedback: string | null = null;
    let aiConfidence: string | null = null;
    let aiMissingConcepts: string[] | null = null;
    let aiRecommendedNextTopic: string | null = null;

    if (question.question_type === "multiple_choice") {
      autoScore = responseValue === question.correct_answer ? Number(question.points) : 0;
      totalScore += autoScore;
    } else {
      const scoringResult =
        question.rubric
          ? await scorePlacementFreeResponse({
              subject: question.subject,
              gradeBand: question.grade_band,
              topic: question.topic,
              question: question.question_text,
              rubric: question.rubric,
              studentResponse: responseValue,
            })
          : null;

      aiScore = scoringResult?.score ?? null;
      aiFeedback = scoringResult?.feedback ?? null;
      aiConfidence = scoringResult?.confidence ?? null;
      aiMissingConcepts = scoringResult?.missing_concepts ?? null;
      aiRecommendedNextTopic = scoringResult?.recommended_next_topic ?? null;
      totalScore += aiScore ?? 0;
    }

    await supabase.from("academy_placement_responses").upsert(
      {
        attempt_id: attemptId,
        question_id: question.id,
        response: responseValue,
        auto_score: autoScore,
        ai_score: aiScore,
        ai_feedback: aiFeedback,
        ai_confidence: aiConfidence,
        ai_missing_concepts: aiMissingConcepts,
        ai_recommended_next_topic: aiRecommendedNextTopic,
      },
      {
        onConflict: "attempt_id,question_id",
      },
    );
  }

  await supabase
    .from("academy_placement_attempts")
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
      total_score: totalScore,
    })
    .eq("id", attemptId);

  revalidatePath(`/placement/${attemptId}`);
  revalidatePath(`/placement/${attemptId}/complete`);
  revalidatePath("/admin/placement");

  return {
    status: "success",
    message: "The placement exam has been submitted successfully.",
  };
}

export async function submitAcademyPlacementAttemptAndRedirectAction(formData: FormData) {
  const attemptId = String(formData.get("attempt_id") ?? "").trim();
  const successRedirect = String(formData.get("success_redirect") ?? "").trim();
  const errorRedirect = String(formData.get("error_redirect") ?? "").trim();
  const result = await submitAcademyPlacementAttemptAction(formData);

  if (result.status === "success") {
    if (successRedirect.startsWith("/") && !successRedirect.startsWith("//")) {
      redirect(successRedirect);
    }

    redirect(`/placement/${attemptId}/complete`);
  }

  if (errorRedirect.startsWith("/") && !errorRedirect.startsWith("//")) {
    redirect(`${errorRedirect}${errorRedirect.includes("?") ? "&" : "?"}error=${encodeURIComponent(result.message)}`);
  }

  redirect(`/placement/${attemptId}?error=${encodeURIComponent(result.message)}`);
}
