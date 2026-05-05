import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

import { getSupabaseServiceClient } from "@/lib/supabase/service";
import type { AcademyIntakeStatus } from "@/lib/academy-intake";
import type {
  AcademyPlacementAttemptStatus,
  AcademyPlacementQuestionType,
  AcademyPaymentStatus,
  AcademySessionNoteStatus,
  AcademySessionStatus,
} from "@/lib/academy-os";

export type AcademyIntakeSubmissionRecord = {
  id: string;
  created_at: string;
  updated_at: string;
  parent_full_name: string;
  parent_email: string;
  parent_phone: string | null;
  student_first_name: string;
  grade: string;
  subject: string;
  course_name: string | null;
  school_name: string | null;
  goals: string;
  upcoming_deadline: string | null;
  session_format: string;
  requested_location: string | null;
  preferred_availability: string | null;
  referral_source: string | null;
  status: AcademyIntakeStatus;
  placement_required: boolean;
  admin_notes: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  converted_parent_id: string | null;
  converted_student_id: string | null;
  converted_student_subject_id: string | null;
  accepted_client_agreement: boolean;
  accepted_terms: boolean;
  accepted_privacy: boolean;
};

export type AcademyParentRecord = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  stripe_customer_id: string | null;
  created_from_intake_id: string | null;
  created_at: string;
  updated_at: string;
};

export type AcademyStudentRecord = {
  id: string;
  parent_id: string | null;
  first_name: string;
  last_name: string | null;
  grade: string;
  school_name: string | null;
  status: string;
  created_from_intake_id: string | null;
  created_at: string;
  updated_at: string;
};

export type AcademyStudentUserRecord = {
  id: string;
  student_id: string;
  email: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type AcademyTutorRecord = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  subjects: string[];
  levels: string[];
  hourly_rate_cents: number | null;
  status: string;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AcademyStudentSubjectRecord = {
  id: string;
  student_id: string | null;
  subject: string;
  course_name: string | null;
  level: string | null;
  tutor_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type AcademySessionRecord = {
  id: string;
  student_id: string | null;
  parent_id: string | null;
  tutor_id: string | null;
  student_subject_id: string | null;
  subject: string;
  course_name: string | null;
  starts_at: string;
  ends_at: string;
  format: string;
  location: string | null;
  meeting_url: string | null;
  google_calendar_event_id: string | null;
  status: AcademySessionStatus;
  payment_status: string;
  created_at: string;
  updated_at: string;
};

export type AcademyPaymentRecord = {
  id: string;
  parent_id: string | null;
  student_id: string | null;
  session_id: string | null;
  stripe_customer_id: string | null;
  stripe_checkout_session_id: string | null;
  stripe_invoice_id: string | null;
  stripe_payment_intent_id: string | null;
  amount_cents: number;
  currency: string;
  status: AcademyPaymentStatus;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type AcademyPackageRecord = {
  id: string;
  name: string;
  description: string | null;
  session_count: number | null;
  amount_cents: number;
  status: string;
  created_at: string;
};

export type AcademySessionNoteRecord = {
  id: string;
  session_id: string | null;
  tutor_id: string | null;
  what_was_covered: string;
  student_understood: string;
  student_struggled_with: string;
  recommended_homework: string | null;
  came_prepared: boolean;
  parent_follow_up_needed: boolean;
  internal_concern: boolean;
  continue_same_pace: boolean;
  tutor_private_notes: string | null;
  admin_status: AcademySessionNoteStatus;
  admin_feedback: string | null;
  validated_by: string | null;
  validated_at: string | null;
  emailed_to_parent_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AcademyRecordingRecord = {
  id: string;
  session_id: string | null;
  recording_url: string;
  storage_provider: string;
  visible_to_parent: boolean;
  expires_at: string;
  created_at: string;
  updated_at: string;
};

export type AcademyEmailLogRecord = {
  id: string;
  recipient: string;
  subject: string;
  template: string;
  status: string;
  provider: string;
  provider_message_id: string | null;
  error_message: string | null;
  related_type: string | null;
  related_id: string | null;
  created_at: string;
  sent_at: string | null;
};

export type AcademyPlacementExamRecord = {
  id: string;
  name: string;
  subject: string;
  grade_band: string | null;
  description: string | null;
  status: string;
  created_at: string;
};

export type AcademyPlacementQuestionRecord = {
  id: string;
  exam_id: string | null;
  subject: string;
  grade_band: string | null;
  topic: string;
  question_type: AcademyPlacementQuestionType;
  question_text: string;
  choices: { label: string; value: string }[] | null;
  correct_answer: string | null;
  rubric: string | null;
  difficulty: string | null;
  points: number;
  created_at: string;
};

export type AcademyPlacementAttemptRecord = {
  id: string;
  intake_id: string | null;
  student_id: string | null;
  exam_id: string | null;
  status: AcademyPlacementAttemptStatus;
  started_at: string | null;
  submitted_at: string | null;
  total_score: number | null;
  ai_recommendation: string | null;
  admin_recommendation: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  access_token: string | null;
  created_at: string;
};

export type AcademyPlacementResponseRecord = {
  id: string;
  attempt_id: string | null;
  question_id: string | null;
  response: string;
  auto_score: number | null;
  ai_score: number | null;
  ai_feedback: string | null;
  ai_confidence: string | null;
  ai_missing_concepts: string[] | null;
  ai_recommended_next_topic: string | null;
  admin_score: number | null;
  created_at: string;
};

export type AcademyCurriculumLesson = {
  slug: string;
  subject: string;
  unit: string;
  topic: string;
  title: string;
  objective: string;
  prerequisites: string;
  tutorNotes: string;
  inSessionExamples: string;
  commonMistakes: string;
  practiceProblems: string;
  homework: string;
  answerKey: string;
  body: string;
};

const curriculumRoot = path.join(process.cwd(), "src", "curriculum");

async function readTable<T>(table: string, orderColumn = "created_at") {
  const supabase = getSupabaseServiceClient() as any;
  const { data, error } = await supabase.from(table).select("*").order(orderColumn, {
    ascending: false,
  });

  if (error) {
    throw error;
  }

  return (data ?? []) as T[];
}

export async function listAcademyIntakeSubmissions() {
  return readTable<AcademyIntakeSubmissionRecord>("academy_intake_submissions");
}

export async function listAcademyParents() {
  return readTable<AcademyParentRecord>("academy_parents");
}

export async function listAcademyStudents() {
  return readTable<AcademyStudentRecord>("academy_students");
}

export async function listAcademyStudentUsers() {
  return readTable<AcademyStudentUserRecord>("academy_student_users");
}

export async function listAcademyTutors() {
  return readTable<AcademyTutorRecord>("academy_tutors");
}

export async function listAcademyStudentSubjects() {
  return readTable<AcademyStudentSubjectRecord>("academy_student_subjects");
}

export async function listAcademySessions() {
  return readTable<AcademySessionRecord>("academy_sessions");
}

export async function listAcademyPayments() {
  return readTable<AcademyPaymentRecord>("academy_payments");
}

export async function listAcademyPackages() {
  return readTable<AcademyPackageRecord>("academy_packages");
}

export async function listAcademySessionNotes() {
  return readTable<AcademySessionNoteRecord>("academy_session_notes");
}

export async function listAcademyRecordings() {
  return readTable<AcademyRecordingRecord>("academy_recordings");
}

export async function listAcademyEmailLogs() {
  return readTable<AcademyEmailLogRecord>("academy_email_logs");
}

export async function listAcademyPlacementExams() {
  return readTable<AcademyPlacementExamRecord>("academy_placement_exams");
}

export async function listAcademyPlacementQuestions() {
  return readTable<AcademyPlacementQuestionRecord>("academy_placement_questions");
}

export async function listAcademyPlacementAttempts() {
  return readTable<AcademyPlacementAttemptRecord>("academy_placement_attempts");
}

export async function listAcademyPlacementResponses() {
  return readTable<AcademyPlacementResponseRecord>("academy_placement_responses");
}

async function maybeSingle<T>(table: string, column: string, value: string) {
  const supabase = getSupabaseServiceClient() as any;
  const { data, error } = await supabase.from(table).select("*").eq(column, value).maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as T | null;
}

export async function getAcademyParentById(id: string) {
  return maybeSingle<AcademyParentRecord>("academy_parents", "id", id);
}

export async function getAcademyStudentById(id: string) {
  return maybeSingle<AcademyStudentRecord>("academy_students", "id", id);
}

export async function getAcademyStudentUserById(id: string) {
  return maybeSingle<AcademyStudentUserRecord>("academy_student_users", "id", id);
}

export async function getAcademyTutorById(id: string) {
  return maybeSingle<AcademyTutorRecord>("academy_tutors", "id", id);
}

export async function getAcademySessionById(id: string) {
  return maybeSingle<AcademySessionRecord>("academy_sessions", "id", id);
}

export async function getAcademyPaymentById(id: string) {
  return maybeSingle<AcademyPaymentRecord>("academy_payments", "id", id);
}

export async function getAcademySessionNoteById(id: string) {
  return maybeSingle<AcademySessionNoteRecord>("academy_session_notes", "id", id);
}

export async function getAcademyPlacementAttemptById(id: string) {
  return maybeSingle<AcademyPlacementAttemptRecord>("academy_placement_attempts", "id", id);
}

export async function getAcademyPlacementExamById(id: string) {
  return maybeSingle<AcademyPlacementExamRecord>("academy_placement_exams", "id", id);
}

export async function getAcademyPlacementQuestionById(id: string) {
  return maybeSingle<AcademyPlacementQuestionRecord>("academy_placement_questions", "id", id);
}

export async function getAcademyStudentSubjectsByStudentId(studentId: string) {
  const allSubjects = await listAcademyStudentSubjects();
  return allSubjects.filter((subject) => subject.student_id === studentId);
}

export async function getAcademySessionsByStudentId(studentId: string) {
  const sessions = await listAcademySessions();
  return sessions.filter((session) => session.student_id === studentId);
}

export async function getAcademyPlacementAttemptsByStudentId(studentId: string) {
  const attempts = await listAcademyPlacementAttempts();
  return attempts.filter((attempt) => attempt.student_id === studentId);
}

export async function getAcademySessionsByParentId(parentId: string) {
  const sessions = await listAcademySessions();
  return sessions.filter((session) => session.parent_id === parentId);
}

export async function getAcademySessionsByTutorId(tutorId: string) {
  const sessions = await listAcademySessions();
  return sessions.filter((session) => session.tutor_id === tutorId);
}

export async function getAcademyPaymentsByParentId(parentId: string) {
  const payments = await listAcademyPayments();
  return payments.filter((payment) => payment.parent_id === parentId);
}

export async function getAcademyPlacementResponsesByAttemptId(attemptId: string) {
  const responses = await listAcademyPlacementResponses();
  return responses.filter((response) => response.attempt_id === attemptId);
}

export async function getAcademyPlacementQuestionsByExamId(examId: string) {
  const questions = await listAcademyPlacementQuestions();
  return questions.filter((question) => question.exam_id === examId);
}

export async function getAcademyRecordingBySessionId(sessionId: string) {
  const recordings = await listAcademyRecordings();
  return recordings.find((recording) => recording.session_id === sessionId) ?? null;
}

export async function getAcademyValidatedSessionNoteBySessionId(sessionId: string) {
  const notes = await listAcademySessionNotes();
  return (
    notes.find(
      (note) =>
        note.session_id === sessionId &&
        (note.admin_status === "validated" || note.admin_status === "emailed"),
    ) ?? null
  );
}

export async function getAcademyParentByEmail(email: string) {
  return maybeSingle<AcademyParentRecord>("academy_parents", "email", email.toLowerCase());
}

export async function getAcademyStudentUserByEmail(email: string) {
  return maybeSingle<AcademyStudentUserRecord>("academy_student_users", "email", email.toLowerCase());
}

export async function getAcademyStudentUserByStudentId(studentId: string) {
  return maybeSingle<AcademyStudentUserRecord>("academy_student_users", "student_id", studentId);
}

export async function getAcademyTutorByEmail(email: string) {
  return maybeSingle<AcademyTutorRecord>("academy_tutors", "email", email.toLowerCase());
}

export async function getAcademyDashboardSummary() {
  const [
    intakes,
    parents,
    students,
    tutors,
    sessions,
    payments,
    notes,
    attempts,
  ] = await Promise.all([
    listAcademyIntakeSubmissions(),
    listAcademyParents(),
    listAcademyStudents(),
    listAcademyTutors(),
    listAcademySessions(),
    listAcademyPayments(),
    listAcademySessionNotes(),
    listAcademyPlacementAttempts(),
  ]);

  return {
    intakes: intakes.length,
    parents: parents.length,
    students: students.length,
    tutors: tutors.length,
    scheduledSessions: sessions.filter((session) => session.status === "scheduled").length,
    pendingPayments: payments.filter((payment) => payment.status === "pending").length,
    submittedNotes: notes.filter((note) => note.admin_status === "submitted").length,
    activePlacementAttempts: attempts.filter((attempt) => attempt.status !== "reviewed").length,
  };
}

function parseFrontmatter(content: string) {
  const segments = content.split("---");

  if (segments.length < 3) {
    throw new Error("Curriculum files must start with a frontmatter block.");
  }

  const frontmatter = segments[1] ?? "";
  const body = segments.slice(2).join("---").trim();
  const values = frontmatter
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((accumulator, line) => {
      const separatorIndex = line.indexOf(":");

      if (separatorIndex === -1) {
        return accumulator;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      accumulator[key] = value;
      return accumulator;
    }, {});

  return { values, body };
}

function parseLessonSections(body: string) {
  const sections = body
    .split(/^##\s+/m)
    .map((section) => section.trim())
    .filter(Boolean);

  const firstSection = sections.shift() ?? "";

  return {
    introduction: firstSection,
    sections,
  };
}

export async function listCurriculumSubjects() {
  const entries = await fs.readdir(curriculumRoot, { withFileTypes: true });

  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
}

export async function listCurriculumLessonsBySubject(subject: string) {
  const subjectDirectory = path.join(curriculumRoot, subject);
  const lessonEntries = await fs.readdir(subjectDirectory, { withFileTypes: true });
  const lessons = await Promise.all(
    lessonEntries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map(async (entry) => {
        const filePath = path.join(subjectDirectory, entry.name);
        const content = await fs.readFile(filePath, "utf8");
        const { values } = parseFrontmatter(content);

        return {
          slug: entry.name.replace(/\.md$/, ""),
          subject: values.subject ?? subject,
          unit: values.unit ?? "",
          topic: values.topic ?? "",
          title: values.title ?? entry.name.replace(/\.md$/, ""),
          objective: values.objective ?? "",
        };
      }),
  );

  return lessons.sort((left, right) => left.title.localeCompare(right.title));
}

export async function getCurriculumLesson(subject: string, lessonSlug: string) {
  const filePath = path.join(curriculumRoot, subject, `${lessonSlug}.md`);
  const content = await fs.readFile(filePath, "utf8");
  const { values, body } = parseFrontmatter(content);
  const parsedBody = parseLessonSections(body);

  const sectionMap = parsedBody.sections.reduce<Record<string, string>>((accumulator, section) => {
    const [headingLine, ...sectionBodyLines] = section.split("\n");
    accumulator[headingLine.trim()] = sectionBodyLines.join("\n").trim();
    return accumulator;
  }, {});

  return {
    slug: lessonSlug,
    subject: values.subject ?? subject,
    unit: values.unit ?? "",
    topic: values.topic ?? "",
    title: values.title ?? lessonSlug,
    objective: values.objective ?? "",
    prerequisites: values.prerequisites ?? "",
    tutorNotes: sectionMap["Tutor Notes"] ?? "",
    inSessionExamples: sectionMap["In-Session Examples"] ?? "",
    commonMistakes: sectionMap["Common Mistakes"] ?? "",
    practiceProblems: sectionMap["Practice Problems"] ?? "",
    homework: sectionMap["Homework"] ?? "",
    answerKey: sectionMap["Answer Key"] ?? "",
    body,
  } satisfies AcademyCurriculumLesson;
}
