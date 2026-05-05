import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { EmptyState } from "@/components/admin/empty-state";
import { SectionCard } from "@/components/admin/section-card";
import {
  listAcademySessionNotes,
  listAcademySessions,
  listAcademyStudents,
  listAcademyTutors,
} from "@/lib/academy-data";
import { requireAcademyAdminUser } from "@/lib/auth/academy-admin";

export default async function AcademyAdminSessionNotesPage() {
  const user = await requireAcademyAdminUser();
  const [notes, sessions, students, tutors] = await Promise.all([
    listAcademySessionNotes(),
    listAcademySessions(),
    listAcademyStudents(),
    listAcademyTutors(),
  ]);

  return (
    <AdminShell
      title="Session notes"
      subtitle="Tutor notes stay internal until an admin validates and approves the parent-facing recap."
      userEmail={user.email ?? "Authenticated user"}
    >
      <SectionCard title="Note review queue">
        {notes.length ? (
          <div className="space-y-4">
            {notes.map((note) => {
              const session = sessions.find((candidate) => candidate.id === note.session_id);
              const student = students.find((candidate) => candidate.id === session?.student_id);
              const tutor = tutors.find((candidate) => candidate.id === note.tutor_id);

              return (
                <article key={note.id} className="rounded-3xl border border-border/70 bg-background/50 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {student ? `${student.first_name} ${student.last_name ?? ""}` : "Student pending"} · {session?.subject || "Session pending"}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Tutor: {tutor?.full_name || "Tutor pending"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {note.admin_status} · {new Date(note.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Link href={`/admin/session-notes/${note.id}`} className="secondary-button px-4 py-2">
                      Open
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No session notes yet"
            description="Tutor-submitted notes will appear here as soon as sessions start completing."
          />
        )}
      </SectionCard>
    </AdminShell>
  );
}
