import Link from "next/link";

import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";

type SupportPlan = {
  title: string;
  monthlyPrice: string;
  tutoringHours: string;
  sessionBlocks: string;
  bestFor: string;
  includes: readonly string[];
  badge?: string;
  featured?: boolean;
};

type ComparisonValue = "included" | "not-included" | string;

type ComparisonRow = {
  feature: string;
  light: ComparisonValue;
  core: ComparisonValue;
  intensive: ComparisonValue;
};

// The monthly plans lead the page, so the data stays centralized for both cards and the table.
const monthlySupportPlans: readonly SupportPlan[] = [
  {
    title: "Light Support",
    monthlyPrice: "$229/month",
    tutoringHours: "4 tutoring hours per month",
    sessionBlocks: "Sessions can be scheduled in 1-hour or 2-hour blocks",
    bestFor:
      "Best for light weekly support, homework help, and students who need steady but lower-intensity guidance.",
    includes: [
      "Minimum session length: 1 hour",
      "Maximum session length: 2 hours",
      "Intake-based support plan",
      "Session notes after every session",
      "Assigned homework or practice after every session",
      "Availability for extra student questions between sessions",
    ],
  },
  {
    title: "Core Support",
    monthlyPrice: "$429/month",
    tutoringHours: "8 tutoring hours per month",
    sessionBlocks: "Sessions can be scheduled in 1-hour or 2-hour blocks",
    bestFor:
      "Best for students who need consistent academic support, test preparation, or help catching up.",
    includes: [
      "Minimum session length: 1 hour",
      "Maximum session length: 2 hours",
      "Intake-based support plan",
      "Session notes after every session",
      "Assigned homework or practice after every session",
      "Availability for extra student questions between sessions",
      "Weekly progress summary",
      "Priority scheduling compared with Light Support",
      "Exam planning",
      "Weak-area repair plan",
    ],
    badge: "Recommended",
    featured: true,
  },
  {
    title: "Intensive Support",
    monthlyPrice: "$629/month",
    tutoringHours: "12 tutoring hours per month",
    sessionBlocks: "Sessions can be scheduled in 1-hour or 2-hour blocks",
    bestFor:
      "Best for students who are behind, preparing for major exams, taking difficult courses, or needing multiple sessions per week.",
    includes: [
      "Minimum session length: 1 hour",
      "Maximum session length: 2 hours",
      "Intake-based support plan",
      "Session notes after every session",
      "Assigned homework or practice after every session",
      "Availability for extra student questions between sessions",
      "Weekly progress summary",
      "Deeper exam planning",
      "Intensive weak-area repair",
      "Highest scheduling priority",
    ],
  },
] as const;

// The comparison table uses shared row data so plan details stay consistent across the page.
const comparisonRows: readonly ComparisonRow[] = [
  {
    feature: "Monthly tutoring hours",
    light: "4 hours",
    core: "8 hours",
    intensive: "12 hours",
  },
  {
    feature: "1-2 hour session blocks",
    light: "included",
    core: "included",
    intensive: "included",
  },
  {
    feature: "Intake-based support plan",
    light: "included",
    core: "included",
    intensive: "included",
  },
  {
    feature: "Session notes after each session",
    light: "included",
    core: "included",
    intensive: "included",
  },
  {
    feature: "Assigned homework/practice",
    light: "included",
    core: "included",
    intensive: "included",
  },
  {
    feature: "Extra student questions between sessions",
    light: "included",
    core: "included",
    intensive: "included",
  },
  {
    feature: "Weekly progress summary",
    light: "not-included",
    core: "included",
    intensive: "included",
  },
  {
    feature: "Priority scheduling",
    light: "not-included",
    core: "included",
    intensive: "Highest priority",
  },
  {
    feature: "Exam planning",
    light: "Basic",
    core: "Included",
    intensive: "Deeper support",
  },
  {
    feature: "Weak-area repair plan",
    light: "Basic",
    core: "Included",
    intensive: "Intensive",
  },
  {
    feature: "Best fit",
    light: "Light weekly help",
    core: "Consistent academic support",
    intensive: "Catch-up or exam-heavy support",
  },
] as const;

const pricingFactors = [
  "Course level and subject difficulty",
  "Urgency and current academic pressure",
  "Student needs and the level of structure required",
  "Tutor fit and scheduling availability",
  "Online versus in-person format",
] as const;

const pricingSteps = [
  "Submit intake with the student’s class, current challenge, goals, and schedule.",
  "We review course fit, support intensity, urgency, tutor fit, and availability.",
  "We recommend the right support option instead of assuming every student needs the same plan.",
  "Final pricing is confirmed before any sessions are scheduled.",
] as const;

const pricingFaq = [
  {
    question: "Are monthly plans automatic for every student?",
    answer:
      "No. Start with intake. We review the student’s course, goals, current challenge, and schedule before recommending the right support option.",
  },
  {
    question: "Can a student still book occasional tutoring?",
    answer:
      "Yes. Flexible tutoring may be available starting at $45 per session, and most families fall between $45 and $70 per session depending on subject, course level, and support needs.",
  },
  {
    question: "When is final pricing confirmed?",
    answer:
      "Final recommendations are made after intake based on course level, urgency, student needs, tutor fit, and availability. Sessions are not scheduled until that review is complete.",
  },
  {
    question: "Does intake lock a family into a plan?",
    answer:
      "No. Submitting intake does not lock you into a plan. It helps us understand the class, the student’s needs, and whether Deebo Academy is the right fit.",
  },
] as const;

function renderComparisonValue(value: ComparisonValue) {
  if (value === "included") {
    return (
      <span className="font-medium text-foreground" aria-label="Included">
        ✓
      </span>
    );
  }

  if (value === "not-included") {
    return (
      <span className="text-muted-foreground" aria-label="Not included">
        -
      </span>
    );
  }

  return value;
}

export default function PricingPage() {
  return (
    <>
      <PageHero
        title="Pricing built around the student’s actual class."
        description="Start with intake. We review the student’s course, current challenge, goals, and schedule before recommending the right support option."
        actions={
          <>
            <Link href="/book" className="primary-button">
              Start Intake
            </Link>
            <Link href="#monthly-support-plans" className="secondary-button">
              View Monthly Plans
            </Link>
          </>
        }
      />

      <section className="pb-16" id="monthly-support-plans">
        <div className="container">
          <Reveal className="site-panel px-6 py-8 md:px-8 md:py-10" initiallyVisible>
            <div className="max-w-3xl">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary/80">
                Monthly support plans
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                Monthly support plans
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
                For students who need more than occasional homework help, monthly support plans
                provide consistent tutoring, session notes, assigned practice, and availability
                for extra questions between sessions.
              </p>
              <p className="mt-5 rounded-[1.35rem] border border-border/70 bg-background/55 px-5 py-4 text-sm leading-relaxed text-muted-foreground">
                Monthly support hours can be scheduled in 1-hour or 2-hour sessions. Final
                recommendations are made after intake based on course level, urgency, student
                needs, tutor fit, and availability.
              </p>
            </div>
          </Reveal>

          {/* The pricing cards use the shared plan data so the visual hierarchy stays clean and consistent. */}
          <div className="mt-6 grid gap-5 xl:grid-cols-3">
            {monthlySupportPlans.map((plan, index) => (
              <Reveal
                key={plan.title}
                delayMs={index * 90}
                className={`site-panel relative flex h-full flex-col overflow-hidden p-7 ${
                  plan.featured
                    ? "border-primary/35 bg-gradient-to-b from-primary/12 via-card/95 to-card/95"
                    : ""
                }`}
              >
                {plan.badge ? (
                  <div className="absolute right-5 top-5 rounded-full border border-primary/30 bg-primary/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    {plan.badge}
                  </div>
                ) : null}

                <div>
                  <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                    {plan.title}
                  </h3>
                  <p className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
                    {plan.monthlyPrice}
                  </p>
                  <p className="mt-3 text-sm font-medium text-foreground">{plan.tutoringHours}</p>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {plan.sessionBlocks}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {plan.bestFor}
                  </p>
                </div>

                <div className="mt-8 flex flex-1 flex-col">
                  <ul className="space-y-3">
                    {plan.includes.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground"
                      >
                        <span className="mt-0.5 text-primary" aria-hidden="true">
                          ✓
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 pt-2">
                    <Link href="/book" className="primary-button w-full">
                      Start Intake
                    </Link>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* The comparison table stays wide enough to remain readable while still working on mobile through scroll. */}
          <Reveal className="mt-6 site-panel overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="min-w-[780px] w-full border-collapse">
                <thead>
                  <tr className="border-b border-border/80 bg-background/55">
                    <th
                      scope="col"
                      className="px-5 py-4 text-left text-sm font-semibold text-foreground md:px-6"
                    >
                      Feature
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-4 text-left text-sm font-semibold text-foreground md:px-6"
                    >
                      Light Support
                    </th>
                    <th
                      scope="col"
                      className="bg-primary/10 px-5 py-4 text-left text-sm font-semibold text-foreground md:px-6"
                    >
                      Core Support
                    </th>
                    <th
                      scope="col"
                      className="px-5 py-4 text-left text-sm font-semibold text-foreground md:px-6"
                    >
                      Intensive Support
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.feature} className="border-b border-border/70 last:border-b-0">
                      <th
                        scope="row"
                        className="px-5 py-4 text-left text-sm font-medium text-foreground md:px-6"
                      >
                        {row.feature}
                      </th>
                      <td className="px-5 py-4 text-sm text-muted-foreground md:px-6">
                        {renderComparisonValue(row.light)}
                      </td>
                      <td className="bg-primary/5 px-5 py-4 text-sm text-muted-foreground md:px-6">
                        {renderComparisonValue(row.core)}
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground md:px-6">
                        {renderComparisonValue(row.intensive)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="pb-14">
        <div className="container">
          {/* Flexible tutoring stays visible, but in a smaller supporting section so monthly plans remain the main decision point. */}
          <Reveal className="site-panel p-7">
            <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Need occasional help?
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
                  Need occasional help?
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  Flexible tutoring may be available starting at $45/session. Most families fall
                  between $45 and $70/session depending on subject, course level, and support
                  needs.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-border/70 bg-background/55 px-5 py-5">
                <p className="text-base font-medium text-foreground">
                  Flexible tutoring starts at $45/session
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Most families fall between $45 and $70/session depending on course level,
                  format, and tutor fit.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Flexible tutoring is best for occasional homework help, test review, or
                  students who are not ready for a monthly plan.
                </p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  Advanced high school, AP, college-level, in-person, or urgent support may be
                  priced differently after intake.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="pb-14" id="how-pricing-works">
        <div className="container">
          {/* The middle section explains both pricing inputs and the intake review process without making pricing sound automatic. */}
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Reveal className="site-panel p-7" variant="left">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                What affects pricing
              </h2>
              <ul className="mt-6 space-y-4">
                {pricingFactors.map((factor) => (
                  <li
                    key={factor}
                    className="flex items-start gap-3 border-b border-border/60 pb-4 text-sm leading-relaxed text-muted-foreground last:border-b-0 last:pb-0"
                  >
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary/80" />
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal className="site-panel p-7" variant="right">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                How pricing works
              </h2>
              <div className="mt-6 space-y-4">
                {pricingSteps.map((step, index) => (
                  <div
                    key={step}
                    className="flex gap-4 rounded-[1.4rem] border border-border/80 bg-background/60 px-5 py-5"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-sm font-semibold text-primary">
                      {index + 1}
                    </div>
                    <p className="pt-2 text-sm leading-relaxed text-muted-foreground">{step}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="pb-14">
        <div className="container">
          <Reveal className="site-panel p-7">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">Pricing FAQ</h2>
              <div className="mt-6 space-y-5">
                {pricingFaq.map((item) => (
                  <div
                    key={item.question}
                    className="border-b border-border/70 pb-5 last:border-b-0 last:pb-0"
                  >
                    <p className="text-base font-medium text-foreground">{item.question}</p>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="pb-24">
        <div className="container">
          <Reveal className="site-panel px-6 py-8 text-center md:px-10 md:py-10">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              Start with intake
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Submitting intake does not lock you into a plan. It helps us understand the class,
              the student’s needs, and whether Deebo Academy is the right fit.
            </p>
            <p className="mt-5 text-sm font-medium text-foreground">
              We confirm fit, availability, and the recommended support structure before any
              sessions are scheduled.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/book" className="primary-button">
                Start Intake
              </Link>
              <Link href="#monthly-support-plans" className="secondary-button">
                View Monthly Plans
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
