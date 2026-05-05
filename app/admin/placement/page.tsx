import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { EmptyState } from "@/components/admin/empty-state";
import { SectionCard } from "@/components/admin/section-card";
import {
  listAcademyIntakeSubmissions,
  listAcademyParents,
  listAcademyPlacementAttempts,
  listAcademyPlacementExams,
  listAcademyPlacementQuestions,
  listAcademyStudents,
} from "@/lib/academy-data";
import { requireAcademyAdminUser } from "@/lib/auth/academy-admin";
import {
  assignAcademyPlacementAttemptAction,
  createAcademyPlacementExamAction,
  createAcademyPlacementQuestionAction,
} from "@/actions/academy-os-admin";

export default async function AcademyAdminPlacementPage() {
  const user = await requireAcademyAdminUser();
  const [exams, questions, attempts, parents, students, intakes] = await Promise.all([
    listAcademyPlacementExams(),
    listAcademyPlacementQuestions(),
    listAcademyPlacementAttempts(),
    listAcademyParents(),
    listAcademyStudents(),
    listAcademyIntakeSubmissions(),
  ]);

  return (
    <AdminShell
      title="Placement"
      subtitle="Placement exams combine autograded multiple choice, AI-assisted free response scoring, and final admin review."
      userEmail={user.email ?? "Authenticated user"}
    >
      <div className="grid gap-6 xl:grid-cols-3">
        <SectionCard title="Create exam">
          <form action={createAcademyPlacementExamAction} className="space-y-4">
            <input name="name" className="field-input" placeholder="Algebra placement baseline" />
            <input name="subject" className="field-input" placeholder="algebra" />
            <input name="grade_band" className="field-input" placeholder="middle school" />
            <textarea name="description" rows={5} className="field-input" placeholder="Exam purpose and fit notes" />
            <button type="submit" className="primary-button">
              Save exam
            </button>
          </form>
        </SectionCard>

        <SectionCard title="Add question">
          <form action={createAcademyPlacementQuestionAction} className="space-y-4">
            <select name="exam_id" className="field-input">
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.name}
                </option>
              ))}
            </select>
            <input name="subject" className="field-input" placeholder="algebra" />
            <input name="grade_band" className="field-input" placeholder="middle school" />
            <input name="topic" className="field-input" placeholder="Linear equations" />
            <input name="question_type" className="field-input" placeholder="multiple_choice or free_response" />
            <textarea name="question_text" rows={5} className="field-input" placeholder="Question text" />
            <textarea name="choices" rows={4} className="field-input" placeholder="One choice per line for multiple choice questions" />
            <input name="correct_answer" className="field-input" placeholder="Correct answer for autograding" />
            <textarea name="rubric" rows={4} className="field-input" placeholder="Rubric for free-response scoring" />
            <input name="points" defaultValue="1" className="field-input" />
            <button type="submit" className="secondary-button">
              Save question
            </button>
          </form>
        </SectionCard>

        <SectionCard title="Assign attempt">
          <form action={assignAcademyPlacementAttemptAction} className="space-y-4">
            <select name="exam_id" className="field-input">
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.name}
                </option>
              ))}
            </select>
            <select name="parent_id" className="field-input">
              {parents.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.full_name}
                </option>
              ))}
            </select>
            <select name="student_id" className="field-input" defaultValue="">
              <option value="">No student record yet</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.first_name} {student.last_name ?? ""}
                </option>
              ))}
            </select>
            <select name="intake_id" className="field-input" defaultValue="">
              <option value="">No intake linked</option>
              {intakes.map((intake) => (
                <option key={intake.id} value={intake.id}>
                  {intake.student_first_name} · {intake.course_name || intake.subject}
                </option>
              ))}
            </select>
            <button type="submit" className="primary-button">
              Assign placement attempt
            </button>
          </form>
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <SectionCard title="Attempts">
          {attempts.length ? (
            <div className="space-y-4">
              {attempts.map((attempt) => {
                const exam = exams.find((candidate) => candidate.id === attempt.exam_id);
                const student = students.find((candidate) => candidate.id === attempt.student_id);

                return (
                  <article key={attempt.id} className="rounded-3xl border border-border/70 bg-background/50 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{exam?.name || "Placement exam"}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {student ? `${student.first_name} ${student.last_name ?? ""}` : "Student pending"} · {attempt.status}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Score: {attempt.total_score ?? "Pending"}
                        </p>
                      </div>
                      <Link href={`/admin/placement/${attempt.id}`} className="secondary-button px-4 py-2">
                        Open
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No placement attempts yet"
              description="Placement attempts will appear here after an exam is assigned."
            />
          )}
        </SectionCard>

        <SectionCard title="Exam library">
          <div className="space-y-3 text-sm text-muted-foreground">
            {exams.length
              ? exams.map((exam) => {
                  const examQuestions = questions.filter((question) => question.exam_id === exam.id);
                  return (
                    <p key={exam.id}>
                      {exam.name} · {exam.subject} · {examQuestions.length} question(s)
                    </p>
                  );
                })
              : "No exams have been created yet."}
          </div>
        </SectionCard>
      </div>
    </AdminShell>
  );
}
