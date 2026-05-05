"use server";

import { revalidatePath } from "next/cache";

import { requireAcademyTutorUser } from "@/lib/auth/academy-portal";
import { getAcademySessionById } from "@/lib/academy-data";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { sanitizeMultilineText } from "@/lib/input-security";

function requireTutorFormValue(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();

  if (!value) {
    throw new Error(`Missing required field: ${key}.`);
  }

  return value;
}

export async function submitAcademyTutorSessionNotesAction(formData: FormData) {
  const { tutor } = await requireAcademyTutorUser();
  const sessionId = requireTutorFormValue(formData, "session_id");
  const session = await getAcademySessionById(sessionId);

  if (!session || session.tutor_id !== tutor.id) {
    throw new Error("This tutor is not assigned to the selected session.");
  }

  const supabase = getSupabaseServiceClient() as any;
  const payload = {
    session_id: sessionId,
    tutor_id: tutor.id,
    what_was_covered: requireTutorFormValue(formData, "what_was_covered"),
    student_understood: requireTutorFormValue(formData, "student_understood"),
    student_struggled_with: requireTutorFormValue(formData, "student_struggled_with"),
    recommended_homework: sanitizeMultilineText(String(formData.get("recommended_homework") ?? ""), {
      maxLength: 1500,
    }) || null,
    came_prepared: String(formData.get("came_prepared") ?? "") === "yes",
    parent_follow_up_needed: String(formData.get("parent_follow_up_needed") ?? "") === "yes",
    internal_concern: String(formData.get("internal_concern") ?? "") === "yes",
    continue_same_pace: String(formData.get("continue_same_pace") ?? "") === "yes",
    tutor_private_notes:
      sanitizeMultilineText(String(formData.get("tutor_private_notes") ?? ""), {
        maxLength: 1500,
      }) || null,
    admin_status: "submitted",
  };

  const { data: existingNote } = await supabase
    .from("academy_session_notes")
    .select("id")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (existingNote?.id) {
    const { error } = await supabase
      .from("academy_session_notes")
      .update(payload)
      .eq("id", existingNote.id);

    if (error) {
      throw error;
    }
  } else {
    const { error } = await supabase.from("academy_session_notes").insert(payload);

    if (error) {
      throw error;
    }
  }

  await supabase
    .from("academy_sessions")
    .update({
      status: "notes_submitted",
    })
    .eq("id", sessionId);

  revalidatePath("/tutor/sessions");
  revalidatePath(`/tutor/sessions/${sessionId}`);
  revalidatePath(`/tutor/sessions/${sessionId}/notes`);
  revalidatePath("/admin/session-notes");
}
