import "server-only";

import {
  listAcademyIntakeSubmissions,
  listAcademyParents,
  listAcademySessionNotes,
  listAcademySessions,
  listAcademyStudents,
  listAcademyStudentSubjects,
  listAcademyTutors,
} from "@/lib/academy-data";

type AcademyWorkflowQueueItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  detail: string;
};

export type AcademyWorkflowQueue = {
  id: string;
  title: string;
  description: string;
  emptyMessage: string;
  items: AcademyWorkflowQueueItem[];
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

function buildStudentName(input: { first_name: string; last_name: string | null }) {
  return `${input.first_name}${input.last_name ? ` ${input.last_name}` : ""}`.trim();
}

function getUpcomingSessionsByStudentSubjectId(studentSubjectId: string, now: Date, sessions: Awaited<ReturnType<typeof listAcademySessions>>) {
  return sessions
    .filter((session) => session.student_subject_id === studentSubjectId && new Date(session.starts_at) >= now)
    .sort((left, right) => new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime());
}

export async function getAcademyWorkflowQueues() {
  const [intakes, parents, students, tutors, studentSubjects, sessions, notes] = await Promise.all([
    listAcademyIntakeSubmissions(),
    listAcademyParents(),
    listAcademyStudents(),
    listAcademyTutors(),
    listAcademyStudentSubjects(),
    listAcademySessions(),
    listAcademySessionNotes(),
  ]);
  const now = new Date();

  const intakeReviewQueue: AcademyWorkflowQueue = {
    id: "intake-review",
    title: "Review intake",
    description: "New requests should move quickly into review, follow-up, approval, or rejection.",
    emptyMessage: "No intake submissions are waiting for first-pass review.",
    items: intakes
      .filter((submission) => submission.status === "new" || submission.status === "reviewing")
      .slice(0, 8)
      .map((submission) => ({
        id: submission.id,
        title: `${submission.student_first_name} · ${submission.course_name || submission.subject}`,
        description: `${submission.parent_full_name} · ${submission.parent_email}`,
        href: `/admin/intake/${submission.id}`,
        detail: `Submitted ${formatDateTime(submission.created_at)} · ${submission.status}`,
      })),
  };

  const intakeConversionQueue: AcademyWorkflowQueue = {
    id: "intake-conversion",
    title: "Convert approved intake",
    description: "Approved requests should become parent, student, and subject records without a second manual tracking step.",
    emptyMessage: "No approved intake submissions are waiting for conversion.",
    items: intakes
      .filter((submission) => submission.status === "approved" && !submission.converted_student_id)
      .slice(0, 8)
      .map((submission) => ({
        id: submission.id,
        title: `${submission.student_first_name} · ${submission.course_name || submission.subject}`,
        description: `${submission.parent_full_name} · ${submission.grade}`,
        href: `/admin/intake/${submission.id}`,
        detail: "Approved but not converted to Academy records",
      })),
  };

  const tutorAssignmentQueue: AcademyWorkflowQueue = {
    id: "tutor-assignment",
    title: "Assign tutor",
    description: "Every student-subject record should either have a tutor or be visibly waiting for one.",
    emptyMessage: "No student-subject records are missing a tutor assignment.",
    items: studentSubjects
      .filter((subject) => !subject.tutor_id)
      .slice(0, 8)
      .map((subject) => {
        const student = students.find((candidate) => candidate.id === subject.student_id);

        return {
          id: subject.id,
          title: `${student ? buildStudentName(student) : "Student pending"} · ${subject.subject}`,
          description: subject.course_name || "Course name pending",
          href: subject.student_id ? `/admin/students/${subject.student_id}` : "/admin/students",
          detail: "Tutor assignment is still missing",
        };
      }),
  };

  const sessionSchedulingQueue: AcademyWorkflowQueue = {
    id: "session-scheduling",
    title: "Schedule first or next session",
    description: "Once a tutor is assigned, the workflow should show which subjects still have no upcoming session.",
    emptyMessage: "All tutor-assigned subjects already have an upcoming session scheduled.",
    items: studentSubjects
      .filter((subject) => subject.tutor_id)
      .filter((subject) => !getUpcomingSessionsByStudentSubjectId(subject.id, now, sessions).length)
      .slice(0, 8)
      .map((subject) => {
        const student = students.find((candidate) => candidate.id === subject.student_id);
        const tutor = tutors.find((candidate) => candidate.id === subject.tutor_id);

        return {
          id: subject.id,
          title: `${student ? buildStudentName(student) : "Student pending"} · ${subject.subject}`,
          description: `${subject.course_name || "Course name pending"} · ${tutor?.full_name || "Tutor assigned"}`,
          href: subject.student_id ? `/admin/students/${subject.student_id}` : "/admin/sessions",
          detail: "No upcoming session is scheduled",
        };
      }),
  };

  const missingNotesQueue: AcademyWorkflowQueue = {
    id: "missing-notes",
    title: "Collect tutor notes",
    description: "Completed sessions should surface quickly when the tutor has not submitted notes yet.",
    emptyMessage: "No completed sessions are waiting on tutor notes.",
    items: sessions
      .filter((session) => new Date(session.starts_at) < now)
      .filter((session) => session.status === "completed" || session.status === "notes_submitted" || session.status === "notes_validated" || session.status === "recap_sent")
      .filter((session) => !notes.some((note) => note.session_id === session.id))
      .slice(0, 8)
      .map((session) => {
        const student = students.find((candidate) => candidate.id === session.student_id);
        const tutor = tutors.find((candidate) => candidate.id === session.tutor_id);

        return {
          id: session.id,
          title: `${student ? buildStudentName(student) : "Student pending"} · ${session.subject}`,
          description: `${tutor?.full_name || "Tutor pending"} · ${formatDateTime(session.starts_at)}`,
          href: `/admin/sessions/${session.id}`,
          detail: "Session completed but no tutor note exists",
        };
      }),
  };

  const noteReviewQueue: AcademyWorkflowQueue = {
    id: "note-review",
    title: "Validate submitted notes",
    description: "Admin review should stay focused on submitted and needs-revision notes, not every historical note.",
    emptyMessage: "No session notes are waiting for admin review.",
    items: notes
      .filter((note) => note.admin_status === "submitted" || note.admin_status === "needs_revision")
      .slice(0, 8)
      .map((note) => {
        const session = sessions.find((candidate) => candidate.id === note.session_id);
        const student = students.find((candidate) => candidate.id === session?.student_id);

        return {
          id: note.id,
          title: `${student ? buildStudentName(student) : "Student pending"} · ${session?.subject || "Session pending"}`,
          description: `Tutor note status: ${note.admin_status}`,
          href: `/admin/session-notes/${note.id}`,
          detail: `Submitted ${formatDateTime(note.updated_at)}`,
        };
      }),
  };

  const recapQueue: AcademyWorkflowQueue = {
    id: "recap-send",
    title: "Send validated recap",
    description: "Validated notes should not sit without the final parent-facing recap step.",
    emptyMessage: "No validated notes are waiting for recap send.",
    items: notes
      .filter((note) => note.admin_status === "validated")
      .slice(0, 8)
      .map((note) => {
        const session = sessions.find((candidate) => candidate.id === note.session_id);
        const student = students.find((candidate) => candidate.id === session?.student_id);
        const parent = parents.find((candidate) => candidate.id === session?.parent_id);

        return {
          id: note.id,
          title: `${student ? buildStudentName(student) : "Student pending"} · ${session?.subject || "Session pending"}`,
          description: parent?.full_name || "Parent pending",
          href: `/admin/session-notes/${note.id}`,
          detail: "Validated recap is ready to send",
        };
      }),
  };

  return [
    intakeReviewQueue,
    intakeConversionQueue,
    tutorAssignmentQueue,
    sessionSchedulingQueue,
    missingNotesQueue,
    noteReviewQueue,
    recapQueue,
  ];
}
