import Link from "next/link";

import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { TestimonialForm } from "@/components/testimonial-form";
import { TestimonialsCarousel } from "@/components/testimonials-carousel";
import { listAcademyTestimonials } from "@/lib/testimonials";

export const dynamic = "force-dynamic";

export default async function TestimonialsPage() {
  const testimonials = await listAcademyTestimonials();

  return (
    <>
      <PageHero
        title="Reviews from students and families who have worked with Deebo Academy"
        description=""
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
          <Reveal className="site-panel overflow-hidden px-0 py-10 sm:py-12">
            <div className="px-6 sm:px-8">
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                Recent testimonials
              </h2>
            </div>

            <div className="mt-8">
              {testimonials.length ? (
                <TestimonialsCarousel testimonials={testimonials} />
              ) : (
                <div className="px-6 sm:px-8">
                  <div className="rounded-3xl border border-dashed border-border/80 bg-background/50 px-6 py-14 text-center">
                    <h4 className="text-lg font-medium text-foreground">No published testimonials yet</h4>
                  </div>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      <section id="leave-review" className="pb-24">
        <div className="container">
          <Reveal className="mx-auto max-w-3xl">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                Submit a testimonial
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Share a written review for Deebo Academy.
              </p>
            </div>
            <TestimonialForm />
          </Reveal>
        </div>
      </section>
    </>
  );
}
