import Link from "next/link";
import { notFound } from "next/navigation";

import { SectionCard } from "@/components/admin/section-card";
import { PortalShell } from "@/components/portal/portal-shell";
import {
  buildParentRecordingAccessPath,
  isParentVisibleRecordingActive,
} from "@/lib/academy-recordings";
import {
  getParentPortalPayments,
  getParentPortalSessions,
  getParentPortalSessionById,
  getPortalRecordingBySessionId,
  getPortalValidatedSessionNote,
} from "@/lib/academy-portal-data";
import { requireAcademyParentUser } from "@/lib/auth/academy-portal";

type ParentSessionDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ParentSessionDetailPage({ params }: ParentSessionDetailPageProps) {
  const { id } = await params;
  const { user, parent } = await requireAcademyParentUser();
  const session = await getParentPortalSessionById(parent.id, id);

  if (!session) {
    notFound();
  }

  const [note, recording] = await Promise.all([
    getPortalValidatedSessionNote(session.id),
    getPortalRecordingBySessionId(session.id),
  ]);
  const [payments, parentSessions] = await Promise.all([
    getParentPortalPayments(parent.id),
    getParentPortalSessions(parent.id),
  ]);
  const activeRecording = isParentVisibleRecordingActive(recording) ? recording : null;
  const linkedPayments = payments.filter((payment) => payment.session_id === session.id);
  const nextSession = parentSessions
    .filter((candidate) => {
      return candidate.student_id === session.student_id && new Date(candidate.starts_at) > new Date(session.starts_at);
    })
    .sort((left, right) => new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime())[0] ?? null;

  return (
    <PortalShell
      title={session.subject}
      subtitle="Use this page for the validated recap, recording window, linked payment state, and the next scheduled step."
      userEmail={user.email ?? parent.email}
      homeLabel="Portal Home"
      homeHref="/parent"
      navigation={[
        { href: "/parent/students", label: "Students" },
        { href: "/parent/sessions", label: "Sessions" },
        { href: "/parent/payments", label: "Payments" },
      ]}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <SectionCard title="Session overview">
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>Date and time: {new Date(session.starts_at).toLocaleString()}</p>
            <p>Course: {session.course_name || "Course name not specified"}</p>
            <p>Format: {session.format}</p>
            <p>Session status: {session.status}</p>
            <p>Payment status: {linkedPayments[0]?.status ?? session.payment_status}</p>
            <p>
              Next session: {nextSession ? `${nextSession.subject} · ${new Date(nextSession.starts_at).toLocaleString()}` : "No next session is scheduled yet."}
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Recording">
            <div className="space-y-3 text-sm text-muted-foreground">
            {activeRecording ? (
              <>
                <Link href={buildParentRecordingAccessPath(session.id)} className="text-primary hover:underline">
                  Open recording
                </Link>
                <p>Available until {new Date(activeRecording.expires_at).toLocaleString()}.</p>
              </>
            ) : (
              <p>No active recording link is available for this session.</p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Validated recap">
          {note ? (
            <div className="space-y-5 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">What was covered</p>
                <p className="mt-2">{note.what_was_covered}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">What the student understood</p>
                <p className="mt-2">{note.student_understood}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">What still needs reinforcement</p>
                <p className="mt-2">{note.student_struggled_with}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Homework / next steps</p>
                <p className="mt-2">{note.recommended_homework || "No homework was assigned."}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No validated recap is available yet. It will appear here after the Academy team reviews the tutor notes.
            </p>
          )}
        </SectionCard>

        <SectionCard title="Linked payments">
          <div className="space-y-3 text-sm text-muted-foreground">
            {linkedPayments.length ? (
              linkedPayments.map((payment) => (
                <div key={payment.id} className="rounded-2xl border border-border/70 bg-background/50 p-4">
                  <p className="font-medium text-foreground">
                    {(payment.amount_cents / 100).toLocaleString("en-US", {
                      style: "currency",
                      currency: payment.currency.toUpperCase(),
                    })}
                  </p>
                  <p className="mt-2">Status: {payment.status}</p>
                  <p className="mt-1">{payment.description || "Academy payment"}</p>
                </div>
              ))
            ) : (
              <p>No payment record is linked to this session.</p>
            )}
          </div>
        </SectionCard>
      </div>
    </PortalShell>
  );
}
