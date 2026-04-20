"use client";

import { useState, useTransition } from "react";
import { createClient } from "@supabase/supabase-js";

import { ACADEMY_TESTIMONIAL_BUCKET } from "@/content/academy-content";
import {
  createTestimonialUploadUrl,
} from "@/actions/create-testimonial-upload-url";
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
  videoPath: "",
  videoUrl: "",
};

function createBrowserSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing public Supabase environment variables.");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export function TestimonialForm() {
  const [isPending, startTransition] = useTransition();
  const [formValues, setFormValues] = useState<AcademyTestimonialFormValues>(defaultValues);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [result, setResult] = useState<SubmitTestimonialResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
    setUploadError(null);
    setResult(null);

    startTransition(async () => {
      let videoPath = "";
      let videoUrl = "";

      if (videoFile) {
        const uploadUrlResult = await createTestimonialUploadUrl({
          fileName: videoFile.name,
          contentType: videoFile.type,
          fileSize: videoFile.size,
        });

        if (uploadUrlResult.status === "error") {
          setResult({
            status: "error",
            message: uploadUrlResult.message,
          });
          return;
        }

        try {
          const supabase = createBrowserSupabaseClient();
          const uploadResult = await supabase.storage
            .from(ACADEMY_TESTIMONIAL_BUCKET)
            .uploadToSignedUrl(uploadUrlResult.path, uploadUrlResult.token, videoFile);

          if (uploadResult.error) {
            throw uploadResult.error;
          }

          const publicUrlResult = supabase.storage
            .from(ACADEMY_TESTIMONIAL_BUCKET)
            .getPublicUrl(uploadUrlResult.path);

          videoPath = uploadUrlResult.path;
          videoUrl = publicUrlResult.data.publicUrl;
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Unable to upload the testimonial video right now.";
          setUploadError(message);
          setResult({
            status: "error",
            message,
          });
          return;
        }
      }

      const nextResult = await submitTestimonial({
        ...formValues,
        videoPath,
        videoUrl,
      });

      setResult(nextResult);

      if (nextResult.status === "success") {
        setFormValues(defaultValues);
        setVideoFile(null);
      }
    });
  }

  return (
    <div className="site-panel p-6 md:p-8">
      <div className="border-b border-border/80 pb-6">
        <h2 className="text-2xl font-semibold text-foreground">Leave a Review</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Share a written testimonial, a short video recording, or both. We review each submission
          before it appears on the site.
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
            <label className="field-label">Class year</label>
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
              placeholder="Amadou Toure"
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
            Add a written testimonial here, upload a short video below, or do both.
          </p>
          {fieldErrors.impression ? <p className="mt-2 text-sm text-destructive">{fieldErrors.impression}</p> : null}
        </div>

        <div>
          <label className="field-label">Video testimonial</label>
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="field-input"
            onChange={(event) => {
              setUploadError(null);
              setVideoFile(event.target.files?.[0] ?? null);
            }}
          />
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Optional. Short MP4, WebM, or QuickTime uploads work best.
          </p>
          {videoFile ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Selected video: <span className="text-foreground">{videoFile.name}</span>
            </p>
          ) : null}
          {uploadError ? <p className="mt-2 text-sm text-destructive">{uploadError}</p> : null}
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          Submitted testimonials are reviewed before publication and typically appear within 24
          hours.
        </p>

        <button type="submit" className="primary-button w-full" disabled={isPending}>
          {isPending ? "Submitting review..." : "Submit review"}
        </button>
      </form>
    </div>
  );
}
