import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { SectionCard } from "@/components/admin/section-card";
import { PortalShell } from "@/components/portal/portal-shell";
import { insertAcademyAuditEvent } from "@/lib/academy-audit";
import { isParentVisibleRecordingActive } from "@/lib/academy-recordings";
import {
  getParentPortalSessionById,
  getPortalRecordingBySessionId,
} from "@/lib/academy-portal-data";
import { requireAcademyParentUser } from "@/lib/auth/academy-portal";

type ParentSessionRecordingAccessPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ParentSessionRecordingAccessPage({
  params,
}: ParentSessionRecordingAccessPageProps) {
  const { id } = await params;
  const { user, parent } = await requireAcademyParentUser();
  const session = await getParentPortalSessionById(parent.id, id);

  if (!session) {
    notFound();
  }

  const recording = await getPortalRecordingBySessionId(session.id);

  if (recording && isParentVisibleRecordingActive(recording)) {
    await insertAcademyAuditEvent({
      actor: user,
      action: "recording.accessed",
      targetType: "academy_recording",
      targetId: recording.id,
      details: {
        role: "parent",
        sessionId: session.id,
      },
    });

    // Parents never receive the raw provider URL in rendered HTML. Access always resolves server-side first.
    redirect(recording.recording_url);
  }

  await insertAcademyAuditEvent({
    actor: user,
    action: "recording.access_denied",
    targetType: "academy_recording",
    targetId: recording?.id ?? null,
    details: {
      role: "parent",
      sessionId: session.id,
      reason: recording ? (recording.visible_to_parent ? "expired" : "hidden") : "missing",
    },
  });

  return (
    <PortalShell
      title="Recording Unavailable"
      subtitle="Recording access is checked inside the Academy portal before the external provider URL is opened."
      userEmail={user.email ?? parent.email}
      homeLabel="Portal Home"
      homeHref="/parent"
      navigation={[
        { href: "/parent/students", label: "Students" },
        { href: "/parent/sessions", label: "Sessions" },
        { href: "/parent/payments", label: "Payments" },
      ]}
    >
      <SectionCard
        title="Recording access"
        description="The recording can be unavailable because it expired, was hidden by the Academy team, or was never attached."
      >
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>
            {recording
              ? recording.visible_to_parent
                ? `This recording expired on ${new Date(recording.expires_at).toLocaleString()}.`
                : "This recording is not currently visible in the parent portal."
              : "No recording is attached to this session yet."}
          </p>
          <Link href={`/parent/sessions/${session.id}`} className="secondary-button inline-flex px-4 py-2">
            Back to session
          </Link>
        </div>
      </SectionCard>
    </PortalShell>
  );
}
