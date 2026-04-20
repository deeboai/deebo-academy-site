import Link from "next/link";

import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { TestimonialForm } from "@/components/testimonial-form";
import { listAcademyTestimonials } from "@/lib/testimonials";

export const dynamic = "force-dynamic";

const testimonialDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

export default async function TestimonialsPage() {
  const testimonials = await listAcademyTestimonials();

  return (
    <>
      <PageHero
        title="Reviews from students and families who have worked with Deebo Academy"
        description="Every review appears with its submission date, and families can share either a written testimonial, a short video, or both."
        actions={
          <>
            <Link href="/book" className="primary-button">
              Start Intake
            </Link>
            <a href="#leave-review" className="secondary-button">
              Leave a Review
            </a>
          </>
        }
      />

      <section className="pb-24">
        <div className="container">
          <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              {testimonials.length ? (
                testimonials.map((testimonial, index) => (
                  <Reveal
                    key={testimonial.id}
                    delayMs={index * 70}
                    className="site-panel hover-glow hover-lift p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xl font-semibold text-foreground">
                          {testimonial.first_name} {testimonial.last_name}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Class year: {testimonial.class_year}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Submitted {testimonialDateFormatter.format(new Date(testimonial.created_at))}
                      </p>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-border/80 bg-background/60 px-4 py-4">
                        <p className="site-kicker">Tutor</p>
                        <p className="mt-2 text-sm text-foreground">{testimonial.tutor_name}</p>
                      </div>
                      <div className="rounded-2xl border border-border/80 bg-background/60 px-4 py-4">
                        <p className="site-kicker">Subject</p>
                        <p className="mt-2 text-sm text-foreground">{testimonial.subject}</p>
                      </div>
                    </div>

                    {testimonial.impression ? (
                      <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                        {testimonial.impression}
                      </p>
                    ) : null}

                    {testimonial.video_url ? (
                      <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-border/80 bg-background/70">
                        <video
                          controls
                          preload="metadata"
                          className="w-full"
                          src={testimonial.video_url}
                        />
                      </div>
                    ) : null}
                  </Reveal>
                ))
              ) : (
                <Reveal className="site-panel p-8">
                  <p className="text-lg font-semibold text-foreground">No testimonials posted yet.</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Reviews will appear here as students and families submit written testimonials or
                    short video reflections about their experience.
                  </p>
                </Reveal>
              )}
            </div>

            <div id="leave-review">
              {/* Only pin the form when the testimonials page is actually in a two-column layout. */}
              <Reveal variant="right" className="xl:sticky xl:top-28">
                <TestimonialForm />
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
