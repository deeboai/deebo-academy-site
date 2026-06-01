import Link from "next/link";

import { BookForm } from "@/components/book-form";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { ACADEMY_FAMILY_FLOW } from "@/content/academy-content";

export default function BookPage() {
  return (
    <>
      <PageHero
        title="Start with intake"
        description="Share the course, the current challenge, and the kind of support needed. We review each request before scheduling."
      />

      <section className="pb-24">
        <div className="container">
          <div className="grid gap-8 xl:grid-cols-[1.18fr_0.82fr]">
            <Reveal variant="left">
              <BookForm />
            </Reveal>

            <Reveal variant="right" className="space-y-6">
              <div className="site-panel p-6 md:p-7">
                <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                  What happens next
                </h3>
                <div className="mt-5 space-y-4">
                  {ACADEMY_FAMILY_FLOW.map((step, index) => (
                    <div
                      key={step.title}
                      className="rounded-[1.4rem] border border-border/80 bg-background/60 px-4 py-4"
                    >
                      <p className="text-sm font-semibold text-foreground">{index + 1}. {step.title}</p>
                      {step.title === "Intake" ? (
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          We receive the course, class level, current challenges, and preferred
                          format through{" "}
                          <Link href="/book" className="text-primary hover:underline">
                            intake
                          </Link>
                          .
                        </p>
                      ) : (
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {step.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Keep the legal links close to the form without turning the page into another wall of panels. */}
              <div className="site-panel p-6 md:p-7">
                <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                  Before you submit
                </h3>
                <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <Link href="/client-agreement" className="secondary-button">
                      Client Agreement
                    </Link>
                    <Link href="/terms" className="secondary-button">
                      Terms
                    </Link>
                    <Link href="/privacy" className="secondary-button">
                      Privacy Policy
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
