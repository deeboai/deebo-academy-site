import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { EmptyState } from "@/components/admin/empty-state";
import { SectionCard } from "@/components/admin/section-card";
import {
  listAcademyParents,
  listAcademyStudents,
  listAcademyStudentSubjects,
} from "@/lib/academy-data";
import { requireAcademyAdminUser } from "@/lib/auth/academy-admin";
import { createAcademyStudentAction } from "@/actions/academy-os-admin";

export default async function AcademyAdminStudentsPage() {
  const user = await requireAcademyAdminUser();
  const [students, parents, studentSubjects] = await Promise.all([
    listAcademyStudents(),
    listAcademyParents(),
    listAcademyStudentSubjects(),
  ]);

  return (
    <AdminShell
      title="Students"
      subtitle="Student records carry the course-specific tutoring relationship and connect to sessions, notes, and progress."
      userEmail={user.email ?? "Authenticated user"}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <SectionCard
          title="Add student"
          description="Create a student directly, connect them to an existing contact, or create a self-managed contact for adult students."
        >
          <form action={createAcademyStudentAction} className="space-y-4">
            <div>
              <label className="field-label">First name</label>
              <input name="first_name" className="field-input" />
            </div>
            <div>
              <label className="field-label">Last name</label>
              <input name="last_name" className="field-input" />
            </div>
            <div>
              <label className="field-label">Grade / level</label>
              <input name="grade" className="field-input" />
            </div>
            <div>
              <label className="field-label">School name</label>
              <input name="school_name" className="field-input" />
            </div>
            <div>
              <label className="field-label">Student status</label>
              <input name="status" defaultValue="active" className="field-input" />
            </div>
            <div>
              <label className="field-label">Parent link mode</label>
              <select name="parent_mode" defaultValue="existing" className="field-input">
                <option value="existing">Link existing contact</option>
                <option value="self_managed">Student is own contact</option>
                <option value="none">No contact yet</option>
              </select>
            </div>
            <div>
              <label className="field-label">Existing contact</label>
              <select name="parent_id" defaultValue="" className="field-input">
                <option value="">No contact selected</option>
                {parents.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.full_name} · {parent.email}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-[1.35rem] border border-border/70 bg-background/45 p-4">
              <p className="record-meta-label">Self-managed contact</p>
              <div className="mt-3 space-y-4">
                <input name="contact_full_name" className="field-input" placeholder="Adult student contact name" />
                <input name="contact_email" type="email" className="field-input" placeholder="Adult student contact email" />
                <input name="contact_phone" className="field-input" placeholder="Adult student contact phone" />
              </div>
            </div>
            <div>
              <label className="field-label">Student portal email</label>
              <input name="student_portal_email" type="email" className="field-input" />
            </div>
            <div>
              <label className="field-label">Initial subject</label>
              <input name="initial_subject" className="field-input" placeholder="algebra, chemistry, french" />
            </div>
            <div>
              <label className="field-label">Initial course name</label>
              <input name="initial_course_name" className="field-input" />
            </div>
            <div>
              <label className="field-label">Initial level</label>
              <input name="initial_level" className="field-input" />
            </div>
            <button type="submit" className="primary-button">
              Save student
            </button>
          </form>
        </SectionCard>

        <SectionCard
          title="Student records"
          description="Each student can hold multiple subject and course relationships over time."
        >
          {students.length ? (
            <div className="space-y-4">
              {students.map((student) => {
                const parent = parents.find((candidate) => candidate.id === student.parent_id);
                const subjects = studentSubjects.filter((subject) => subject.student_id === student.id);

                return (
                  <article key={student.id} className="record-row">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="workspace-eyebrow">Student</p>
                        <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                          {student.first_name} {student.last_name ?? ""}
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">{student.grade}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {parent?.full_name || "No contact linked"}
                        </p>
                        <p className="mt-3 text-sm text-muted-foreground">
                          Subject records: {subjects.length}
                        </p>
                      </div>
                      <Link
                        href={`/admin/students/${student.id}`}
                        className="secondary-button px-4 py-2"
                      >
                        Open
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No student records yet"
              description="Create the first student here or convert an approved intake."
            />
          )}
        </SectionCard>
      </div>
    </AdminShell>
  );
}
