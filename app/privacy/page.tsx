import { LegalPage } from "@/components/legal-page";

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="Deebo Academy Privacy Policy"
      description="This Privacy Policy explains what information Deebo Academy collects, how it is used, which service providers help operate the Academy, and how families can request help with their information."
    >
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">1. Information collected</h2>
        <p>
          Deebo Academy may collect parent or guardian contact information, student information,
          subject and course information, scheduling details, homework or performance records,
          session notes, and other information reasonably necessary to review fit and provide
          tutoring services.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">2. Parent and student information</h2>
        <p>
          Parent information may include names, email addresses, phone numbers, and billing-related
          contact details. Student information may include first name, grade level, subject area,
          course name, goals, performance context, and notes related to tutoring progress.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">3. Payment, promo, and access-code information</h2>
        <p>
          Deebo Academy uses Stripe or another active payment processor to collect sensitive
          payment details. Deebo Academy does not store full card numbers or full bank account
          numbers.
        </p>
        <p>
          Deebo Academy may store payment-related identifiers from the processor, enrollment
          amounts, promo code usage, access-code usage, and subscription status records needed to
          operate billing and enrollment.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">4. Session notes, homework, and recordings</h2>
        <p>
          Tutors or Academy staff may maintain session notes, homework follow-up records,
          performance observations, and similar instructional records. If sessions are recorded,
          recordings are used only for tutoring operations, family access, quality control, or
          instructional continuity as allowed by Deebo Academy&apos;s policies and applicable law.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">5. How information is used</h2>
        <p>
          Deebo Academy uses information to review tutoring fit, manage enrollment, process
          payments, coordinate scheduling, deliver tutoring, communicate with families, maintain
          service records, improve internal operations, and protect against misuse of the website or
          checkout flow.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">6. Third-party services</h2>
        <p>
          Deebo Academy may use third-party providers for payment processing, database and storage
          infrastructure, communications, scheduling, or other operational support. These providers
          may include Stripe for payment processing, Supabase for database or storage operations,
          and email or communication providers used for Academy follow-up.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">7. Data retention and security</h2>
        <p>
          Deebo Academy retains information for as long as reasonably needed to operate services,
          maintain records, resolve disputes, comply with law, and protect legitimate business
          interests. Deebo Academy uses reasonable administrative and technical safeguards, but no
          internet-based system can be guaranteed perfectly secure.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">8. Children and student privacy</h2>
        <p>
          Deebo Academy expects a parent or legal guardian to provide consent and direction when a
          minor student uses the service. Families should avoid submitting unnecessary sensitive
          personal information through public forms or free-text fields.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">9. Parent rights and requests</h2>
        <p>
          Parents, guardians, and adult students may request reasonable access, correction, or
          deletion assistance for information Deebo Academy controls, subject to operational,
          billing, legal, or recordkeeping needs.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">10. Contact</h2>
        <p>
          Questions or requests related to this Privacy Policy may be sent through the contact
          methods published on the Deebo Academy website.
        </p>
      </section>
    </LegalPage>
  );
}
