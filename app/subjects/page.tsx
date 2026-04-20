import Image from "next/image";
import Link from "next/link";

import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { ACADEMY_SUBJECTS } from "@/content/academy-content";

export default function SubjectsPage() {
  return (
    <>
      <PageHero
        title="Course support organized around the actual class, not generic tutoring packages"
        description="We support math, biology, chemistry, physics, French, psychology, sociology, biochemistry, and computer science, with course level and fit reviewed through intake."
        actions={
          <>
            <Link href="/book" className="primary-button">
              Start Intake
            </Link>
            <Link href="/pricing" className="secondary-button">
              How Pricing Works
            </Link>
          </>
        }
      />

      <section className="pb-24">
        <div className="container">
          <div className="grid gap-6 lg:grid-cols-2">
            {ACADEMY_SUBJECTS.map((subject, index) => (
              <Reveal
                key={subject.value}
                delayMs={index * 70}
                className="site-panel hover-glow hover-lift group overflow-hidden"
              >
                <div className="relative h-72">
                  <Image
                    src={subject.imageSrc}
                    alt={subject.imageAlt}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-7">
                  <h2 className="text-3xl font-semibold text-foreground">{subject.label}</h2>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {subject.description}
                  </p>
                  <div className="mt-6 rounded-[1.5rem] border border-border/80 bg-background/60 p-5">
                    <p className="text-sm font-medium text-foreground">Support focus</p>
                    <ul className="mt-4 space-y-3">
                      {subject.focus.map((item) => (
                        <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                          <span className="mt-1.5 inline-flex h-2 w-2 rounded-full bg-primary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
