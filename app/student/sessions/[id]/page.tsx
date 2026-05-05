import { notFound } from "next/navigation";

import { SectionCard } from "@/components/admin/section-card";
import { PortalShell } from "@/components/portal/portal-shell";
import {
  getAcademyRecordingBySessionId,
  getAcademySessionById,
  getAcademyValidatedSessionNoteBySessionId,
} from "@/lib/academy-data";
import { requireAcademyStudentUser } from "@/lib/auth/academy-portal";

type StudentSessionDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function StudentSessionDetailPage({ params }: StudentSessionDetailPageProps) {
  const { id } = await params;
  const { user, student } = await requireAcademyStudentUser();
  const session = await getAcademySessionById(id);

  if (!session || session.student_id !== student.id) {
    notFound();
  }

  const [note, recording] = await Promise.all([
    getAcademyValidatedSessionNoteBySessionId(session.id),
    getAcademyRecordingBySessionId(session.id),
  ]);
  const showRecording =
    recording && recording.visible_to_parent && new Date(recording.expires_at) > new Date();

  return (
    <PortalShell
      title={session.subject}
      subtitle="Session details, validated recap notes, and active recording visibility appear here."
      userEmail={user.email ?? "Authenticated student"}
      homeLabel="Student Home"
      homeHref="/student"
      navigation={[
        { href: "/student/placement", label: "Placement" },
        { href: "/student/sessions", label: "Sessions" },
      ]}
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Session summary">
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>{new Date(session.starts_at).toLocaleString()}</p>
            <p>{session.course_name || "Course name not specified"}</p>
            <p>{note ? note.what_was_covered : "No validated recap is available yet."}</p>
            {note ? <p>{note.recommended_homework || "No homework was assigned."}</p> : null}
          </div>
        </SectionCard>

        <SectionCard title="Recording">
          <div className="space-y-3 text-sm text-muted-foreground">
            {showRecording ? (
              <>
                <a href={recording.recording_url} className="text-primary hover:underline">
                  Open recording
                </a>
                <p>Available until {new Date(recording.expires_at).toLocaleString()}.</p>
              </>
            ) : (
              <p>No active recording link is available for this session.</p>
            )}
          </div>
        </SectionCard>
      </div>
    </PortalShell>
  );
}
