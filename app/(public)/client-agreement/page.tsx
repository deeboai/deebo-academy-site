import { LegalPage } from "@/components/legal-page";

export default function ClientAgreementPage() {
  return (
    <LegalPage
      eyebrow="Client Agreement"
      title="Deebo Academy Client Agreement"
      description="This Client Agreement explains the tutoring relationship, recurring billing structure, family expectations, and service protections that apply when Deebo Academy enrollment is purchased or used."
    >
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">1. Services provided</h2>
        <p>
          Deebo Academy provides academic tutoring, study support, academic coaching, and test
          preparation in the subjects and support scope approved by Deebo Academy. Services may
          include live tutoring sessions, follow-up notes, assigned practice, progress
          communication, and related academic support planning.
        </p>
        <p>
          Deebo Academy may adjust tutor assignment, support cadence, session structure, or
          instructional workflow when needed to deliver services responsibly.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">2. No guaranteed outcomes</h2>
        <p>
          Deebo Academy does not guarantee grades, test scores, admissions outcomes, scholarships,
          class placement, school decisions, or any specific academic result. Outcomes depend on
          many factors outside Deebo Academy&apos;s control, including school instruction, attendance,
          student effort, home follow-through, time available, and the student&apos;s own preparation.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">3. Student and family responsibilities</h2>
        <p>
          Families are responsible for providing accurate course information, maintaining a stable
          learning environment, ensuring the student attends sessions on time, and supporting the
          student&apos;s use of assigned homework or practice.
        </p>
        <p>
          Students remain responsible for completing schoolwork, communicating honestly about their
          progress, and participating in sessions in good faith.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">4. Scheduling, attendance, and missed time</h2>
        <p>
          Sessions are scheduled according to the approved plan and tutor availability. Families
          should provide reasonable advance notice for conflicts. Late arrivals reduce the usable
          session time because Deebo Academy reserves the scheduled block.
        </p>
        <p>
          Missed sessions, no-shows, and late cancellations may be treated as used session time if
          the reserved slot cannot reasonably be reassigned. Deebo Academy may offer rescheduling
          when notice, calendar space, and instructional continuity make that practical, but
          rescheduling is not guaranteed.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">5. Payment and recurring billing</h2>
        <p>
          Monthly enrollment is billed through Stripe as a recurring monthly subscription. ACH or
          bank account payments receive preferred pricing. Card payments include the disclosed card
          price adjustment shown during checkout.
        </p>
        <p>
          Promo codes or discounts, when approved, are applied according to their stated terms.
          Promo codes may be limited by dates, usage caps, or plan eligibility. Deebo Academy may
          decline or revoke discounts that were applied in error or used contrary to their terms.
        </p>
        <p>
          Families are responsible for keeping payment information current. If a payment fails,
          Deebo Academy may pause scheduling, pause services, or terminate the enrollment if the
          balance is not resolved in a reasonable timeframe.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">6. Refund policy</h2>
        <p>
          Unless Deebo Academy states otherwise in writing, monthly tutoring memberships are billed
          for the recurring support structure that reserves time, planning capacity, and tutor
          availability. Refunds are not guaranteed once a billing cycle begins, except where
          required by law or where Deebo Academy chooses to make a specific accommodation.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">7. Homework, notes, and communication</h2>
        <p>
          Deebo Academy may assign homework, practice tasks, or review items between sessions.
          Deebo Academy may also provide summary notes, progress feedback, or next-step guidance to
          the parent, guardian, or approved adult contact.
        </p>
        <p>
          Families are responsible for monitoring communications from Deebo Academy and for
          responding when scheduling, academic concerns, or payment issues require a decision.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">8. Recording policy and technology requirements</h2>
        <p>
          If Deebo Academy records a session, recording will be used only for tutoring operations,
          instructional continuity, quality control, or family access consistent with Deebo
          Academy&apos;s policies. Families should not assume every session is recorded.
        </p>
        <p>
          Families are responsible for the student&apos;s internet access, device readiness, and basic
          platform compatibility for remote sessions.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">9. Conduct and academic honesty</h2>
        <p>
          Parents and students must treat tutors and staff respectfully. Deebo Academy may suspend
          or terminate service for abusive conduct, repeated disruption, harassment, or misuse of
          tutoring time.
        </p>
        <p>
          Deebo Academy supports legitimate learning and preparation. Families and students may not
          use services to facilitate cheating, plagiarism, academic dishonesty, or policy
          violations at school or testing institutions.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">10. Termination and limitation of liability</h2>
        <p>
          Deebo Academy may decline, pause, or terminate services when there is a fit problem,
          safety concern, payment issue, repeated scheduling breakdown, or conduct issue. Families
          may also stop services, subject to any open balances or commitments already incurred.
        </p>
        <p>
          To the fullest extent permitted by law, Deebo Academy and DeeboAI are not liable for
          indirect, incidental, special, or consequential damages arising from tutoring services,
          scheduling issues, technology interruptions, or academic decisions made by the family or
          school.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">11. Acceptance</h2>
        <p>
          By purchasing, activating, or using Deebo Academy services, the purchasing parent,
          guardian, or adult student confirms acceptance of this Client Agreement together with the
          Terms of Use and Privacy Policy.
        </p>
      </section>
    </LegalPage>
  );
}
