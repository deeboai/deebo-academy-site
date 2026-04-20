"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { sanitizeMultilineText, sanitizePlainText } from "@/lib/input-security";
import { getSupabaseClient } from "@/lib/supabase";

const academyTestimonialSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, "Enter the student's first name.")
      .max(60, "First names must be 60 characters or fewer."),
    lastName: z
      .string()
      .trim()
      .min(1, "Enter the student's last name.")
      .max(60, "Last names must be 60 characters or fewer."),
    classYear: z
      .string()
      .trim()
      .min(1, "Enter the class year.")
      .max(40, "Class year must be 40 characters or fewer."),
    tutorName: z
      .string()
      .trim()
      .min(1, "Enter the tutor's name.")
      .max(120, "Tutor names must be 120 characters or fewer."),
    subject: z
      .string()
      .trim()
      .min(1, "Enter the subject.")
      .max(120, "Subjects must be 120 characters or fewer."),
    impression: z.string().trim().max(2000, "Written testimonials must be 2000 characters or fewer."),
    videoPath: z.string().trim().max(500).optional().or(z.literal("")),
    videoUrl: z.string().trim().url().max(1000).optional().or(z.literal("")),
  })
  .superRefine((value, ctx) => {
    if (!value.impression && !value.videoPath) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add a written testimonial, a video recording, or both.",
        path: ["impression"],
      });
    }
  });

export type AcademyTestimonialFormValues = z.infer<typeof academyTestimonialSchema>;

export type SubmitTestimonialResult =
  | {
      status: "success";
      message: string;
    }
  | {
      status: "error";
      message: string;
      fieldErrors?: Partial<Record<keyof AcademyTestimonialFormValues, string>>;
    };

export async function submitTestimonial(
  values: AcademyTestimonialFormValues,
): Promise<SubmitTestimonialResult> {
  const parsedValues = academyTestimonialSchema.safeParse(values);

  if (!parsedValues.success) {
    const fieldErrors = parsedValues.error.flatten().fieldErrors;

    return {
      status: "error",
      message:
        parsedValues.error.issues[0]?.message ??
        "Complete the testimonial form before submitting.",
      fieldErrors: {
        firstName: fieldErrors.firstName?.[0],
        lastName: fieldErrors.lastName?.[0],
        classYear: fieldErrors.classYear?.[0],
        tutorName: fieldErrors.tutorName?.[0],
        subject: fieldErrors.subject?.[0],
        impression: fieldErrors.impression?.[0],
        videoPath: fieldErrors.videoPath?.[0],
        videoUrl: fieldErrors.videoUrl?.[0],
      },
    };
  }

  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("academy_testimonials").insert({
      first_name: sanitizePlainText(parsedValues.data.firstName, { maxLength: 60 }),
      last_name: sanitizePlainText(parsedValues.data.lastName, { maxLength: 60 }),
      class_year: sanitizePlainText(parsedValues.data.classYear, { maxLength: 40 }),
      tutor_name: sanitizePlainText(parsedValues.data.tutorName, { maxLength: 120 }),
      subject: sanitizePlainText(parsedValues.data.subject, { maxLength: 120 }),
      impression: parsedValues.data.impression
        ? sanitizeMultilineText(parsedValues.data.impression, { maxLength: 2000 })
        : null,
      video_path: parsedValues.data.videoPath || null,
      video_url: parsedValues.data.videoUrl || null,
      moderation_status: "pending",
      is_published: false,
    });

    if (error) {
      throw error;
    }

    revalidatePath("/testimonials");

    return {
      status: "success",
      message: "Thanks. Your testimonial has been received and will be reviewed before it appears online, usually within 24 hours.",
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Unable to submit the testimonial right now. Please try again shortly.",
    };
  }
}
