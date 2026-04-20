import { LegalPage } from "@/components/legal-page";

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="Deebo Academy Privacy Policy"
      description="This policy explains what information Deebo Academy collects, how it uses that information, and how intake data is handled."
    >
      <p>
        Deebo Academy collects only the information needed to review tutoring fit and manage
        service follow-up. Intake requests ask for booking contact details, the student&apos;s first
        name, grade, subject, goals, and format preference.
      </p>
      <p>
        Deebo Academy does not ask for unnecessary sensitive student data through the public intake
        workflow. Families should avoid sharing medical records, school IDs, or unrelated private
        information in the free-text field.
      </p>
      <p>
        Intake information is used to review tutoring fit, contact the intake submitter,
        coordinate scheduling, and improve future Academy operations and support planning.
      </p>
      <p>
        If the student is 18 or older, they may act as the booking contact. If the student is
        under 18, a parent or legal guardian serves as the booking contact for intake and service
        coordination.
      </p>
      <p>
        Deebo Academy may use third-party providers to operate the website and booking-related
        services. Intake data is not sold. Information may be shared only with service providers
        that support site operations, communication, or tutoring delivery.
      </p>
      <p>
        Booking contacts may request updates or deletion of intake information, subject to
        operational or legal retention needs.
      </p>
    </LegalPage>
  );
}
