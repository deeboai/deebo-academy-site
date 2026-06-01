import { LegalPage } from "@/components/legal-page";

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms"
      title="Deebo Academy Terms of Use"
      description="These Terms of Use govern use of the Deebo Academy website, checkout flow, intake workflows, and related tutoring services."
    >
      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">1. Website and service use</h2>
        <p>
          The Deebo Academy website is provided to describe services, collect inquiries, support
          approved enrollment, and manage related tutoring operations. You may use the site only
          for lawful, good-faith interaction with Deebo Academy.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">2. Eligibility and authority</h2>
        <p>
          A student who is 18 or older may purchase or use services for themselves. If the student
          is a minor, a parent or legal guardian must have authority to purchase the services,
          submit information, and accept the governing legal documents on the minor&apos;s behalf.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">3. Submitted information</h2>
        <p>
          You agree to provide accurate and current information when using intake forms, checkout,
          contact forms, or related features. Deebo Academy may rely on the information you submit
          when reviewing fit, scheduling services, and managing billing.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">4. Payments and recurring billing</h2>
        <p>
          Approved purchases are processed through Stripe or another active payment processor. Some
          plans use recurring monthly billing. ACH or bank account payments may receive preferred
          pricing, while card payments may include the disclosed card price adjustment presented
          during checkout.
        </p>
        <p>
          Promo codes are optional, may be limited by dates or eligibility rules, and may be
          revoked if misused or applied in error.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">5. Intellectual property and content ownership</h2>
        <p>
          The Deebo Academy website, branding, written content, downloads, workflows, and tutoring
          materials are owned by Deebo Academy, DeeboAI, or their licensors unless otherwise
          stated. You may not copy, republish, resell, or exploit site materials beyond personal
          review and normal tutoring participation without written permission.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">6. Prohibited use</h2>
        <p>
          You may not misuse the site, interfere with its operation, attempt unauthorized access,
          submit fraudulent information, use access codes or promo codes improperly, or use Deebo
          Academy materials to support cheating, plagiarism, or other dishonest activity.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">7. No guaranteed outcomes and disclaimers</h2>
        <p>
          Deebo Academy does not guarantee academic outcomes, grades, test scores, admissions,
          scholarships, or other educational results. The website and services are provided on an
          as-is and as-available basis to the fullest extent permitted by law.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">8. Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, Deebo Academy and DeeboAI are not liable for
          indirect, incidental, consequential, or special damages arising from website use,
          tutoring use, payment interruptions, scheduling disputes, or academic decisions.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">9. Changes to these terms</h2>
        <p>
          Deebo Academy may update these Terms of Use from time to time. Continued use of the
          website or services after updated terms are posted means you accept the revised terms.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">10. Acceptance and contact</h2>
        <p>
          Purchasing or using Deebo Academy means accepting this Terms of Use document together
          with the Client Agreement and Privacy Policy.
        </p>
        <p>
          Questions about these terms may be sent through the contact methods listed on the Deebo
          Academy website.
        </p>
      </section>
    </LegalPage>
  );
}
