"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import {
  ACADEMY_FORMAT_OPTIONS,
  ACADEMY_SUBJECTS,
} from "@/content/academy-content";
import {
  type AcademyIntakeActionResult,
  submitAcademyIntake,
} from "@/actions/submit-academy-intake";
import type { AcademyIntakeFormValues } from "@/lib/academy-schema";

const defaultValues: AcademyIntakeFormValues = {
  parentFullName: "",
  parentEmail: "",
  parentPhone: "",
  studentFirstName: "",
  grade: "",
  subject: "",
  goals: "",
  format: "online",
  acceptClientAgreement: false,
  acceptTerms: false,
  acceptPrivacy: false,
};

export function BookForm() {
  const [isPending, startTransition] = useTransition();
  const [formValues, setFormValues] = useState<AcademyIntakeFormValues>(defaultValues);
  const [result, setResult] = useState<AcademyIntakeActionResult | null>(null);

  function updateValue<Key extends keyof AcademyIntakeFormValues>(
    key: Key,
    value: AcademyIntakeFormValues[Key],
  ) {
    setFormValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  const fieldErrors = result?.status === "error" ? result.fieldErrors ?? {} : {};

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const nextResult = await submitAcademyIntake(formValues);
      setResult(nextResult);

      if (nextResult.status === "success") {
        setFormValues(defaultValues);
      }
    });
  }

  return (
    <div className="site-panel p-6 md:p-8">
      <div className="border-b border-border/80 pb-6">
        <h2 className="text-2xl font-semibold text-foreground">Intake</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Share the course, class level, and current challenges so we can review fit, confirm the
          required terms, and follow up with scheduling guidance.
        </p>
      </div>

      {result?.status === "success" ? (
        <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/10 px-5 py-4 text-sm text-foreground">
          <p className="font-medium">Intake received.</p>
          <p className="mt-2 text-muted-foreground">
            Reference: <span className="font-mono text-foreground">{result.referenceId.slice(0, 8)}</span>.{" "}
            {result.message}
          </p>
        </div>
      ) : null}

      {result?.status === "error" ? (
        <div className="mt-6 rounded-2xl border border-destructive/40 bg-destructive/10 px-5 py-4 text-sm text-destructive-foreground">
          <p className="font-medium text-foreground">{result.message}</p>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="field-label">Contact full name</label>
            <input
              className="field-input"
              value={formValues.parentFullName}
              onChange={(event) => updateValue("parentFullName", event.target.value)}
              placeholder="Your full name"
            />
            {fieldErrors.parentFullName ? (
              <p className="mt-2 text-sm text-destructive">{fieldErrors.parentFullName}</p>
            ) : null}
          </div>

          <div>
            <label className="field-label">Contact email</label>
            <input
              type="email"
              className="field-input"
              value={formValues.parentEmail}
              onChange={(event) => updateValue("parentEmail", event.target.value)}
              placeholder="you@example.com"
            />
            {fieldErrors.parentEmail ? (
              <p className="mt-2 text-sm text-destructive">{fieldErrors.parentEmail}</p>
            ) : null}
          </div>

          <div>
            <label className="field-label">Contact phone</label>
            <input
              className="field-input"
              value={formValues.parentPhone}
              onChange={(event) => updateValue("parentPhone", event.target.value)}
              placeholder="Optional"
            />
            <p className="mt-2 text-sm text-muted-foreground">
              Add a phone number if you would like follow-up by phone.
            </p>
            {fieldErrors.parentPhone ? (
              <p className="mt-2 text-sm text-destructive">{fieldErrors.parentPhone}</p>
            ) : null}
          </div>

          <div>
            <label className="field-label">Student first name</label>
            <input
              className="field-input"
              value={formValues.studentFirstName}
              onChange={(event) => updateValue("studentFirstName", event.target.value)}
              placeholder="Avery"
            />
            {fieldErrors.studentFirstName ? (
              <p className="mt-2 text-sm text-destructive">{fieldErrors.studentFirstName}</p>
            ) : null}
          </div>

          <div>
            <label className="field-label">Grade</label>
            <input
              className="field-input"
              value={formValues.grade}
              onChange={(event) => updateValue("grade", event.target.value)}
              placeholder="8th grade, AP Biology, general chemistry, college biology, etc."
            />
            {fieldErrors.grade ? (
              <p className="mt-2 text-sm text-destructive">{fieldErrors.grade}</p>
            ) : null}
          </div>

          <div>
            <label className="field-label">Subject</label>
            <select
              className="field-input"
              value={formValues.subject}
              onChange={(event) => updateValue("subject", event.target.value)}
            >
              <option value="">Select a subject</option>
              {ACADEMY_SUBJECTS.map((subject) => (
                <option key={subject.value} value={subject.value}>
                  {subject.label}
                </option>
              ))}
            </select>
            {fieldErrors.subject ? (
              <p className="mt-2 text-sm text-destructive">{fieldErrors.subject}</p>
            ) : null}
          </div>
        </div>

        <div>
          <label className="field-label">Goals or current challenges</label>
          <textarea
            rows={6}
            className="field-input"
            value={formValues.goals}
            onChange={(event) => updateValue("goals", event.target.value)}
            placeholder="Share the topic, class, or academic challenge the student needs help with."
          />
          <p className="mt-2 text-sm text-muted-foreground">
            Keep this focused on the class, pacing, upcoming assignments or exams, and the kind of
            support the student needs.
          </p>
          {fieldErrors.goals ? (
            <p className="mt-2 text-sm text-destructive">{fieldErrors.goals}</p>
          ) : null}
        </div>

        <div>
          <label className="field-label">Format</label>
          <select
            className="field-input"
            value={formValues.format}
            onChange={(event) => updateValue("format", event.target.value as AcademyIntakeFormValues["format"])}
          >
            {ACADEMY_FORMAT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-sm text-muted-foreground">
            Online is the primary format. In-person requests are reviewed based on scheduling,
            location, and fit.
          </p>
          {fieldErrors.format ? (
            <p className="mt-2 text-sm text-destructive">{fieldErrors.format}</p>
          ) : null}
        </div>

        {/* Legal acceptance stays explicit because the booking contact must have authority to accept the service terms. */}
        <div className="rounded-[1.5rem] border border-border/80 bg-background/60 p-5">
          <p className="text-base font-medium text-foreground">Required legal acceptance</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            The person submitting this request must review and accept each document before sending
            intake.
          </p>

          <div className="mt-5 space-y-4">
            <label className="flex items-start gap-3 rounded-2xl border border-border/80 bg-card/80 p-4">
              <input
                type="checkbox"
                checked={formValues.acceptClientAgreement}
                onChange={(event) => updateValue("acceptClientAgreement", event.target.checked)}
                className="mt-1 h-4 w-4"
              />
              <span className="text-sm text-muted-foreground">
                I accept the{" "}
                <Link href="/client-agreement" className="text-primary hover:underline">
                  Client Agreement
                </Link>
                .
              </span>
            </label>
            {fieldErrors.acceptClientAgreement ? (
              <p className="text-sm text-destructive">{fieldErrors.acceptClientAgreement}</p>
            ) : null}

            <label className="flex items-start gap-3 rounded-2xl border border-border/80 bg-card/80 p-4">
              <input
                type="checkbox"
                checked={formValues.acceptTerms}
                onChange={(event) => updateValue("acceptTerms", event.target.checked)}
                className="mt-1 h-4 w-4"
              />
              <span className="text-sm text-muted-foreground">
                I accept the{" "}
                <Link href="/terms" className="text-primary hover:underline">
                  Terms
                </Link>
                .
              </span>
            </label>
            {fieldErrors.acceptTerms ? (
              <p className="text-sm text-destructive">{fieldErrors.acceptTerms}</p>
            ) : null}

            <label className="flex items-start gap-3 rounded-2xl border border-border/80 bg-card/80 p-4">
              <input
                type="checkbox"
                checked={formValues.acceptPrivacy}
                onChange={(event) => updateValue("acceptPrivacy", event.target.checked)}
                className="mt-1 h-4 w-4"
              />
              <span className="text-sm text-muted-foreground">
                I accept the{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
            {fieldErrors.acceptPrivacy ? (
              <p className="text-sm text-destructive">{fieldErrors.acceptPrivacy}</p>
            ) : null}
          </div>
        </div>

        <button type="submit" className="primary-button w-full" disabled={isPending}>
          {isPending ? "Submitting intake..." : "Submit intake"}
        </button>
      </form>
    </div>
  );
}
