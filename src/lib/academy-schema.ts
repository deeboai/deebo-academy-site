import { z } from "zod";

import { ACADEMY_FORMAT_OPTIONS, ACADEMY_SUBJECTS } from "@/content/academy-content";

const academySubjectValues = new Set<string>(ACADEMY_SUBJECTS.map((subject) => subject.value));
const academyFormatValues = new Set<string>(ACADEMY_FORMAT_OPTIONS.map((option) => option.value));

// The standalone site still validates the same intake rules so the subdomain behaves like the main workflow.
export const academyIntakeSchema = z
  .object({
    parentFullName: z
      .string()
      .trim()
      .min(2, "Enter the booking contact's full name.")
      .max(120, "Contact names must be 120 characters or fewer."),
    parentEmail: z
      .string()
      .trim()
      .email("Enter a valid booking contact email address.")
      .max(320, "Email addresses must be 320 characters or fewer."),
    parentPhone: z
      .string()
      .trim()
      .max(30, "Phone numbers must be 30 characters or fewer.")
      .optional()
      .or(z.literal("")),
    studentFirstName: z
      .string()
      .trim()
      .min(1, "Enter the student's first name.")
      .max(60, "Student first names must be 60 characters or fewer."),
    grade: z
      .string()
      .trim()
      .min(1, "Enter the student's grade or school level.")
      .max(60, "Grades and school levels must be 60 characters or fewer."),
    subject: z
      .string()
      .trim()
      .min(1, "Select a subject.")
      .refine((value) => academySubjectValues.has(value), "Select a supported subject."),
    courseName: z
      .string()
      .trim()
      .min(2, "Enter the specific course name.")
      .max(120, "Course names must be 120 characters or fewer."),
    schoolName: z
      .string()
      .trim()
      .max(120, "School names must be 120 characters or fewer.")
      .optional()
      .or(z.literal("")),
    currentChallenge: z
      .string()
      .trim()
      .min(10, "Describe the student's current challenge.")
      .max(1500, "Current challenge details must be 1500 characters or fewer."),
    upcomingDeadline: z
      .string()
      .trim()
      .min(3, "Share the next exam, project, or deadline.")
      .max(160, "Deadlines must be 160 characters or fewer."),
    format: z
      .string()
      .trim()
      .min(1, "Select a session format.")
      .refine((value) => academyFormatValues.has(value), "Select a supported format."),
    requestedLocation: z
      .string()
      .trim()
      .max(160, "Location notes must be 160 characters or fewer.")
      .optional()
      .or(z.literal("")),
    preferredAvailability: z
      .string()
      .trim()
      .min(5, "Share the student's best availability.")
      .max(300, "Availability details must be 300 characters or fewer."),
    referralSource: z
      .string()
      .trim()
      .max(120, "Referral source details must be 120 characters or fewer.")
      .optional()
      .or(z.literal("")),
    acceptClientAgreement: z.boolean().refine((value) => value, {
      message: "You must accept the Client Agreement before submitting.",
    }),
    acceptTerms: z.boolean().refine((value) => value, {
      message: "You must accept the Terms before submitting.",
    }),
    acceptPrivacy: z.boolean().refine((value) => value, {
      message: "You must accept the Privacy Policy before submitting.",
    }),
  })
  .superRefine((values, context) => {
    if (values.format === "in-person" && !values.requestedLocation?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["requestedLocation"],
        message: "Add the requested location for an in-person tutoring request.",
      });
    }
  });

export type AcademyIntakeFormValues = z.infer<typeof academyIntakeSchema>;
