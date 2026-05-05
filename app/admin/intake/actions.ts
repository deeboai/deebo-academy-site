"use server";

import { revalidatePath } from "next/cache";

import {
  type AcademyIntakeStatus,
  isAcademyIntakeStatus,
} from "@/lib/academy-intake";
import { requireAcademyAdminUser } from "@/lib/auth/academy-admin";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

type IntakeStatusRow = {
  id: string;
  status: AcademyIntakeStatus;
};

function getSubmissionId(formData: FormData) {
  const submissionId = String(formData.get("submission_id") ?? "").trim();

  if (!submissionId) {
    throw new Error("Missing intake submission id.");
  }

  return submissionId;
}

function revalidateAcademyIntakeRoutes(submissionId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/intake");
  revalidatePath(`/admin/intake/${submissionId}`);
}

export async function updateAcademyIntakeStatusAction(formData: FormData) {
  const submissionId = getSubmissionId(formData);
  const nextStatusValue = String(formData.get("status") ?? "").trim();
  const eventNote = String(formData.get("event_note") ?? "").trim();

  if (!isAcademyIntakeStatus(nextStatusValue)) {
    throw new Error("Invalid Academy intake status.");
  }

  const user = await requireAcademyAdminUser();
  const supabase = getSupabaseServiceClient() as any;
  const { data: currentSubmission, error: currentSubmissionError } = await supabase
    .from("academy_intake_submissions")
    .select("id, status")
    .eq("id", submissionId)
    .maybeSingle();

  if (currentSubmissionError) {
    throw currentSubmissionError;
  }

  const submission = currentSubmission as IntakeStatusRow | null;

  if (!submission) {
    throw new Error("The selected intake submission was not found.");
  }

  const { error: updateError } = await supabase
    .from("academy_intake_submissions")
    .update({
      status: nextStatusValue,
      placement_required: nextStatusValue === "placement_required",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", submissionId);

  if (updateError) {
    throw updateError;
  }

  // Every status transition is recorded so intake review decisions stay readable over time.
  const { error: eventError } = await supabase
    .from("academy_intake_status_events")
    .insert({
      intake_submission_id: submissionId,
      previous_status: submission.status,
      next_status: nextStatusValue,
      changed_by: user.id,
      changed_by_email: user.email ?? null,
      note: eventNote || null,
    });

  if (eventError) {
    throw eventError;
  }

  revalidateAcademyIntakeRoutes(submissionId);
}

export async function updateAcademyIntakeNotesAction(formData: FormData) {
  const submissionId = getSubmissionId(formData);
  const adminNotes = String(formData.get("admin_notes") ?? "").trim();

  const user = await requireAcademyAdminUser();
  const supabase = getSupabaseServiceClient() as any;
  const { error } = await supabase
    .from("academy_intake_submissions")
    .update({
      admin_notes: adminNotes || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", submissionId);

  if (error) {
    throw error;
  }

  revalidateAcademyIntakeRoutes(submissionId);
}
