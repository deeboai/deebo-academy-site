"use client";

import { useState, useTransition } from "react";
import {
  submitTestimonial,
  type AcademyTestimonialFormValues,
  type SubmitTestimonialResult,
} from "@/actions/submit-testimonial";

const defaultValues: AcademyTestimonialFormValues = {
  firstName: "",
  lastName: "",
  classYear: "",
  tutorName: "",
  subject: "",
  impression: "",
};

export function TestimonialForm() {
  const [isPending, startTransition] = useTransition();
  const [formValues, setFormValues] = useState<AcademyTestimonialFormValues>(defaultValues);
  const [result, setResult] = useState<SubmitTestimonialResult | null>(null);

  function updateValue<Key extends keyof AcademyTestimonialFormValues>(
    key: Key,
    value: AcademyTestimonialFormValues[Key],
  ) {
    setFormValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  const fieldErrors = result?.status === "error" ? result.fieldErrors ?? {} : {};

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);

    startTransition(async () => {
      const nextResult = await submitTestimonial(formValues);

      setResult(nextResult);

      if (nextResult.status === "success") {
        setFormValues(defaultValues);
      }
    });
  }

  return (
    <div className="site-panel p-6 md:p-8">
      <div className="border-b border-border/80 pb-6">
        <h2 className="text-2xl font-semibold text-foreground">Leave a Review</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Share a written testimonial for Deebo Academy.
        </p>
      </div>

      {result?.status === "success" ? (
        <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/10 px-5 py-4 text-sm text-foreground">
          {result.message}
        </div>
      ) : null}

      {result?.status === "error" ? (
        <div className="mt-6 rounded-2xl border border-destructive/40 bg-destructive/10 px-5 py-4 text-sm text-foreground">
          {result.message}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="field-label">First name</label>
            <input
              className="field-input"
              value={formValues.firstName}
              onChange={(event) => updateValue("firstName", event.target.value)}
              placeholder="Jordan"
              required
            />
            {fieldErrors.firstName ? <p className="mt-2 text-sm text-destructive">{fieldErrors.firstName}</p> : null}
          </div>

          <div>
            <label className="field-label">Last name</label>
            <input
              className="field-input"
              value={formValues.lastName}
              onChange={(event) => updateValue("lastName", event.target.value)}
              placeholder="Lee"
              required
            />
            {fieldErrors.lastName ? <p className="mt-2 text-sm text-destructive">{fieldErrors.lastName}</p> : null}
          </div>

          <div>
            <label className="field-label">Class year of student</label>
            <input
              className="field-input"
              value={formValues.classYear}
              onChange={(event) => updateValue("classYear", event.target.value)}
              placeholder="2027"
              required
            />
            {fieldErrors.classYear ? <p className="mt-2 text-sm text-destructive">{fieldErrors.classYear}</p> : null}
          </div>

          <div>
            <label className="field-label">Tutor worked with</label>
            <input
              className="field-input"
              value={formValues.tutorName}
              onChange={(event) => updateValue("tutorName", event.target.value)}
              placeholder="Anna Rooney"
              required
            />
            {fieldErrors.tutorName ? <p className="mt-2 text-sm text-destructive">{fieldErrors.tutorName}</p> : null}
          </div>

          <div className="md:col-span-2">
            <label className="field-label">Subject</label>
            <input
              className="field-input"
              value={formValues.subject}
              onChange={(event) => updateValue("subject", event.target.value)}
              placeholder="Biology, Algebra II, Biochemistry, Computer Science, etc."
              required
            />
            {fieldErrors.subject ? <p className="mt-2 text-sm text-destructive">{fieldErrors.subject}</p> : null}
          </div>
        </div>

        <div>
          <label className="field-label">Written impression</label>
          <textarea
            rows={6}
            className="field-input"
            value={formValues.impression}
            onChange={(event) => updateValue("impression", event.target.value)}
            placeholder="Describe what the tutoring experience felt like, what improved, and what you would want other families to know."
          />
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Share what stood out about the tutoring experience and what improved.
          </p>
          {fieldErrors.impression ? <p className="mt-2 text-sm text-destructive">{fieldErrors.impression}</p> : null}
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          Submitted testimonials typically appear within 24 hours.
        </p>

        <button type="submit" className="primary-button w-full" disabled={isPending}>
          {isPending ? "Submitting review..." : "Submit review"}
        </button>
      </form>
    </div>
  );
}
