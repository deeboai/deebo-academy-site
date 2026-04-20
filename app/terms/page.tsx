import { LegalPage } from "@/components/legal-page";

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Terms"
      title="Deebo Academy Terms"
      description="These terms apply to use of the Deebo Academy website and related tutoring intake workflows."
    >
      <p>
        The Deebo Academy website is provided for informational and booking-related purposes. You
        may use the site to review tutoring information, read service policies, and submit intake.
      </p>
      <p>
        Students who are 18 or older may book tutoring for themselves. If the student is under 18,
        a parent or legal guardian must accept the legal terms and act as the contracting party.
      </p>
      <p>
        Content on these pages is intended to describe Deebo Academy&apos;s tutoring services and
        operating approach. Visitors should not interpret this site as legal, academic-placement,
        or school-policy advice.
      </p>
      <p>
        By submitting intake, you confirm that the information you provide is accurate to the best
        of your knowledge. Deebo Academy may rely on that information when determining fit and
        follow-up.
      </p>
      <p>
        The site is offered on an as-is basis. Deebo Academy does not guarantee uninterrupted
        access, error-free operation, or any specific website performance level.
      </p>
      <p>
        To the fullest extent permitted by law, Deebo Academy and DeeboAI are not liable for
        indirect, incidental, or consequential damages arising from use of the website.
      </p>
      <p>
        These terms may be updated from time to time as the Academy grows. Continued use of the
        site after changes are posted constitutes acceptance of the updated terms.
      </p>
    </LegalPage>
  );
}
