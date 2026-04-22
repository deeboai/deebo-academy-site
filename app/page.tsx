import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Reveal } from "@/components/reveal";
import {
  ACADEMY_COLLEGE_REQUESTS,
  ACADEMY_FAMILY_FLOW,
  ACADEMY_SUBJECTS,
  ACADEMY_TESTIMONIALS_ENABLED,
} from "@/content/academy-content";
import { SectionHeading } from "@/components/section-heading";

const regularCoverageValues = new Set([
  "algebra",
  "geometry",
  "precalculus",
  "calculus",
  "physics",
  "french",
]);

export default function HomePage() {
  const heroPoster =
    ACADEMY_SUBJECTS.find((subject) => subject.value === "biology") ?? ACADEMY_SUBJECTS[0];
  const regularSubjects = ACADEMY_SUBJECTS.filter((subject) =>
    regularCoverageValues.has(subject.value),
  );

  return (
    <>
      <section className="site-section relative overflow-hidden pb-14 pt-20">
        <div className="absolute inset-0">
          {/* The video is the visual anchor for the first screen, with the poster filling any loading gap. */}
          <Image
            src={heroPoster.imageSrc}
            alt={heroPoster.imageAlt}
            fill
            priority
            className="object-cover opacity-25"
          />
          <video
            className="hero-video-shell opacity-24"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster={heroPoster.imageSrc}
          >
            <source src="/homepage_video.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/62" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/80 to-background" />
        </div>

        <div className="container relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            <div
              className="animate-fade-in-up"
              style={{ animationDelay: "40ms", animationFillMode: "both" }}
            >
              {/* Match the main-site two-word title treatment while giving the Academy wordmark more presence. */}
              <p className="text-[1.8rem] font-semibold tracking-tight text-foreground sm:text-[2.2rem] md:text-[2.6rem]">
                <span className="text-foreground">Deebo </span>
                <span className="text-primary">Academy</span>
              </p>
            </div>
            <h1
              className="mt-4 animate-fade-in-up text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-7xl"
              style={{ animationDelay: "120ms", animationFillMode: "both" }}
            >
              Private tutoring for the classes that need help now.
            </h1>
            <p
              className="mx-auto mt-6 max-w-2xl animate-fade-in-up text-base leading-relaxed text-muted-foreground sm:text-lg"
              style={{ animationDelay: "200ms", animationFillMode: "both" }}
            >
              Math, biology, chemistry, physics, French, and select college-level coursework,
              with every plan built from the student&apos;s actual class and current pace.
            </p>

            <div
              className="mt-8 flex flex-col items-center justify-center gap-4 animate-fade-in-up sm:flex-row"
              style={{ animationDelay: "280ms", animationFillMode: "both" }}
            >
              <Link href="/book" className="primary-button">
                Start Intake
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/subjects" className="text-sm font-medium text-foreground/85 hover:text-primary">
                View subjects
              </Link>
            </div>
          </div>

        </div>
      </section>

      <section className="site-section">
        <div className="container">
          <SectionHeading
            title="Subject support built around the actual course"
            description="We tutor core school subjects and review select college-level requests through intake before tutoring is confirmed."
          />

          {/* Keep the coverage section compact so the page feels like a tutoring site, not a deck of repeated cards. */}
          <Reveal className="site-panel p-6 md:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
              <div className="max-w-xl">
                <h3 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                  Subjects we support
                </h3>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  We build tutoring around the actual class, pace, and current challenge rather
                  than forcing every request into the same format.
                </p>
                <div className="mt-6">
                  <Link href="/subjects" className="secondary-button">
                    Full subject list
                  </Link>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-foreground">School subjects</h4>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {regularSubjects.map((subject) => (
                      <div
                        key={subject.value}
                        className="rounded-full border border-border/80 bg-background/60 px-4 py-2.5 text-sm font-medium text-foreground"
                      >
                        {subject.label}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border/70 pt-6">
                  <h4 className="text-lg font-semibold text-foreground">College-level requests</h4>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    We also review college requests in calculus, chemistry, biology,
                    biochemistry, computer science, physics, psychology, and sociology through{" "}
                    <Link href="/book" className="text-primary hover:underline">
                      intake
                    </Link>{" "}
                    before tutoring is confirmed.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {ACADEMY_COLLEGE_REQUESTS.map((subject) => (
                      <div
                        key={subject}
                        className="rounded-full border border-border/80 bg-background/60 px-4 py-2.5 text-sm font-medium text-foreground"
                      >
                        {subject}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="site-section">
        <div className="container">
          <SectionHeading
            title="Simple intake, clear review, then tutoring"
          />

          <div className="grid gap-6 md:grid-cols-3">
            {ACADEMY_FAMILY_FLOW.map((item, index) => (
              <Reveal
                key={item.title}
                delayMs={index * 80}
                className="site-panel p-6 md:p-7"
              >
                <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                  {index + 1}. {item.title}
                </h3>
                {item.title === "Intake" ? (
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    We receive the course, class level, current challenges, and preferred format
                    through{" "}
                    <Link href="/book" className="text-primary hover:underline">
                      intake
                    </Link>
                    .
                  </p>
                ) : (
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                )}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="site-section pt-8">
        <div className="container">
          <Reveal className="site-panel mx-auto max-w-3xl px-8 py-10 text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Start with intake and we&apos;ll review the course from there.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
              We start with intake, review the course details, and recommend the right support
              plan from there.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/book" className="primary-button">
                Start Intake
              </Link>
              {ACADEMY_TESTIMONIALS_ENABLED ? (
                <Link
                  href="/testimonials"
                  className="text-sm font-medium text-foreground/85 hover:text-primary"
                >
                  Read testimonials
                </Link>
              ) : null}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
