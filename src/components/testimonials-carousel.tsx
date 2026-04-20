import type { AcademyTestimonial } from "@/lib/testimonials";

const testimonialDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

function TestimonialCard({ testimonial }: { testimonial: AcademyTestimonial }) {
  return (
    <article className="testimonial-card w-[20rem] shrink-0 sm:w-[23rem]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-foreground">
            {testimonial.first_name} {testimonial.last_name}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Class year {testimonial.class_year}</p>
        </div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {testimonialDateFormatter.format(new Date(testimonial.created_at))}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="rounded-full border border-border/80 bg-background/70 px-3 py-1 text-xs font-medium text-foreground">
          {testimonial.subject}
        </span>
        <span className="rounded-full border border-border/80 bg-background/70 px-3 py-1 text-xs font-medium text-foreground">
          {testimonial.tutor_name}
        </span>
      </div>

      {testimonial.impression ? (
        <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
          &ldquo;{testimonial.impression}&rdquo;
        </p>
      ) : null}

      {testimonial.video_url ? (
        <div className="mt-5 overflow-hidden rounded-[1.35rem] border border-border/80 bg-background/70">
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="h-44 w-full object-cover"
            src={testimonial.video_url}
          />
        </div>
      ) : null}
    </article>
  );
}

export function TestimonialsCarousel({ testimonials }: { testimonials: AcademyTestimonial[] }) {
  const marqueeTestimonials = [...testimonials, ...testimonials];

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-background via-background/90 to-transparent sm:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-background via-background/90 to-transparent sm:w-24" />

      <div className="testimonial-marquee-track">
        {marqueeTestimonials.map((testimonial, index) => (
          <TestimonialCard key={`${testimonial.id}-${index}`} testimonial={testimonial} />
        ))}
      </div>
    </div>
  );
}

