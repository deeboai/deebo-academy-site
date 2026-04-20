"use server";

import {
  ACADEMY_FORMAT_OPTIONS,
  ACADEMY_SUBJECTS,
} from "@/content/academy-content";
import {
  academyIntakeSchema,
  type AcademyIntakeFormValues,
} from "@/lib/academy-schema";
import { sendAcademyIntakeEmails } from "@/lib/email";
import {
  sanitizeEmailAddress,
  sanitizeMultilineText,
  sanitizePlainText,
} from "@/lib/input-security";
import { getSupabaseClient } from "@/lib/supabase";

export type AcademyIntakeActionResult =
  | {
      status: "success";
      message: string;
      referenceId: string;
      emailSent: boolean;
    }
  | {
      status: "error";
      message: string;
      fieldErrors?: Partial<Record<keyof AcademyIntakeFormValues, string>>;
    };

type AcademyIntakeInsert = {
  id: string;
  parent_full_name: string;
  parent_email: string;
  parent_phone: string | null;
  student_first_name: string;
  grade: string;
  subject: string;
  goals: string;
  session_format: string;
  status: "new";
  accepted_client_agreement: boolean;
  accepted_terms: boolean;
  accepted_privacy: boolean;
};

function sanitizeOptionalPhoneNumber(value: string | undefined) {
  const sanitizedValue = sanitizePlainText(value ?? "", { maxLength: 30 });

  return sanitizedValue || null;
}

export async function submitAcademyIntake(
  values: AcademyIntakeFormValues,
): Promise<AcademyIntakeActionResult> {
  const parsedValues = academyIntakeSchema.safeParse(values);

  if (!parsedValues.success) {
    const fieldErrors = parsedValues.error.flatten().fieldErrors;

    return {
      status: "error",
      message:
        parsedValues.error.issues[0]?.message ??
        "Complete the required intake fields before submitting.",
      fieldErrors: {
        parentFullName: fieldErrors.parentFullName?.[0],
        parentEmail: fieldErrors.parentEmail?.[0],
        parentPhone: fieldErrors.parentPhone?.[0],
        studentFirstName: fieldErrors.studentFirstName?.[0],
        grade: fieldErrors.grade?.[0],
        subject: fieldErrors.subject?.[0],
        goals: fieldErrors.goals?.[0],
        format: fieldErrors.format?.[0],
        acceptClientAgreement: fieldErrors.acceptClientAgreement?.[0],
        acceptTerms: fieldErrors.acceptTerms?.[0],
        acceptPrivacy: fieldErrors.acceptPrivacy?.[0],
      },
    };
  }

  const submissionId = crypto.randomUUID();
  const submissionRow: AcademyIntakeInsert = {
    id: submissionId,
    parent_full_name: sanitizePlainText(parsedValues.data.parentFullName, {
      maxLength: 120,
    }),
    parent_email: sanitizeEmailAddress(parsedValues.data.parentEmail),
    parent_phone: sanitizeOptionalPhoneNumber(parsedValues.data.parentPhone),
    student_first_name: sanitizePlainText(parsedValues.data.studentFirstName, {
      maxLength: 60,
    }),
    grade: sanitizePlainText(parsedValues.data.grade, { maxLength: 40 }),
    subject: sanitizePlainText(parsedValues.data.subject, { maxLength: 80 }),
    goals: sanitizeMultilineText(parsedValues.data.goals, { maxLength: 1500 }),
    session_format: sanitizePlainText(parsedValues.data.format, { maxLength: 40 }),
    status: "new",
    accepted_client_agreement: true,
    accepted_terms: true,
    accepted_privacy: true,
  };

  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("academy_intake_submissions")
      .insert(submissionRow);

    if (error) {
      throw error;
    }

    const subjectLabel =
      ACADEMY_SUBJECTS.find((subject) => subject.value === parsedValues.data.subject)
        ?.label ?? parsedValues.data.subject;
    const formatLabel =
      ACADEMY_FORMAT_OPTIONS.find((option) => option.value === parsedValues.data.format)
        ?.label ?? parsedValues.data.format;
    let emailSent = false;

    try {
      const emailResult = await sendAcademyIntakeEmails({
        referenceId: submissionId,
        parentFullName: submissionRow.parent_full_name,
        parentEmail: submissionRow.parent_email,
        studentFirstName: submissionRow.student_first_name,
        grade: submissionRow.grade,
        subjectLabel,
        formatLabel,
        goals: submissionRow.goals,
      });
      emailSent = emailResult.sent;
    } catch (emailError) {
      console.error("Academy intake email delivery failed", emailError);
    }

    return {
      status: "success",
      message: emailSent
        ? "A confirmation email has been sent, and Deebo Academy will follow up with next steps and scheduling guidance."
        : "Intake submitted. Deebo Academy will follow up with next steps and scheduling guidance.",
      referenceId: submissionId,
      emailSent,
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Unable to submit the Academy intake right now. Please try again shortly.",
    };
  }
}
