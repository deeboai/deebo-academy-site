import { z } from "zod";

import { ACADEMY_FORMAT_OPTIONS, ACADEMY_SUBJECTS } from "@/content/academy-content";

const academySubjectValues = new Set<string>(ACADEMY_SUBJECTS.map((subject) => subject.value));
const academyFormatValues = new Set<string>(ACADEMY_FORMAT_OPTIONS.map((option) => option.value));

// The standalone site still validates the same intake rules so the subdomain behaves like the main workflow.
export const academyIntakeSchema = z.object({
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
    .min(1, "Enter the student's grade.")
    .max(40, "Grades must be 40 characters or fewer."),
  subject: z
    .string()
    .trim()
    .min(1, "Select a subject.")
    .refine((value) => academySubjectValues.has(value), "Select a supported subject."),
  goals: z
    .string()
    .trim()
    .min(10, "Add a short note about the student's goals or current challenges.")
    .max(1500, "Goals and challenges must be 1500 characters or fewer."),
  format: z
    .string()
    .trim()
    .min(1, "Select a session format.")
    .refine((value) => academyFormatValues.has(value), "Select a supported format."),
  acceptClientAgreement: z.boolean().refine((value) => value, {
    message: "You must accept the Client Agreement before submitting.",
  }),
  acceptTerms: z.boolean().refine((value) => value, {
    message: "You must accept the Terms before submitting.",
  }),
  acceptPrivacy: z.boolean().refine((value) => value, {
    message: "You must accept the Privacy Policy before submitting.",
  }),
});

export type AcademyIntakeFormValues = z.infer<typeof academyIntakeSchema>;
