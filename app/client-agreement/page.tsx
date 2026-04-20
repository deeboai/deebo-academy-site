import { LegalPage } from "@/components/legal-page";

export default function ClientAgreementPage() {
  return (
    <LegalPage
      eyebrow="Client Agreement"
      title="Deebo Academy Client Agreement"
      description="This agreement governs Deebo Academy tutoring services between Deebo Academy and the person who books and pays for the service."
    >
      <p>
        Students who are 18 or older may submit intake and contract for tutoring services
        themselves. If the student is under 18, a parent or legal guardian must submit intake,
        accept the legal terms, and act as the contracting party.
      </p>
      <p>
        Deebo Academy provides structured academic tutoring in supported subjects, including math,
        science, and French. Service format, cadence, and fit are confirmed after intake review.
      </p>
      <p>
        Online tutoring is the standard delivery model. In-person sessions may be offered
        selectively when Deebo Academy confirms availability and logistical fit.
      </p>
      <p>
        Payment terms, scheduling expectations, and cancellation policies are communicated before
        services begin. Deebo Academy may charge for late cancellations or missed sessions when
        reserved time cannot reasonably be reused.
      </p>
      <p>
        Deebo Academy does not guarantee grades, test scores, admissions outcomes, class placement,
        or any specific academic result. Outcomes depend on factors outside the tutoring workflow,
        including attendance, effort, school instruction, and the student’s own follow-through.
      </p>
      <p>
        Deebo Academy may update service structure, pricing, scheduling methods, or operational
        processes as the tutoring program grows.
      </p>
    </LegalPage>
  );
}
