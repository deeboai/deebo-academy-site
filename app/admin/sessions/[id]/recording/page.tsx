import { notFound, redirect } from "next/navigation";

import { insertAcademyAuditEvent } from "@/lib/academy-audit";
import { getAcademyRecordingBySessionId, getAcademySessionById } from "@/lib/academy-data";
import { requireAcademyAdminUser } from "@/lib/auth/academy-admin";

type AcademyAdminSessionRecordingAccessPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AcademyAdminSessionRecordingAccessPage({
  params,
}: AcademyAdminSessionRecordingAccessPageProps) {
  const { id } = await params;
  const user = await requireAcademyAdminUser();
  const session = await getAcademySessionById(id);

  if (!session) {
    notFound();
  }

  const recording = await getAcademyRecordingBySessionId(session.id);

  if (!recording) {
    notFound();
  }

  await insertAcademyAuditEvent({
    actor: user,
    action: "recording.previewed",
    targetType: "academy_recording",
    targetId: recording.id,
    details: {
      role: "admin",
      sessionId: session.id,
      expiredAtPreview: new Date(recording.expires_at) <= new Date(),
      visibleToParentAtPreview: recording.visible_to_parent,
    },
  });

  // Admin preview stays available even after parent expiry so operators can verify or repair the upstream link.
  redirect(recording.recording_url);
}
