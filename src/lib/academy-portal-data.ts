import "server-only";

import type {
  AcademyPaymentRecord,
  AcademyRecordingRecord,
  AcademySessionNoteRecord,
  AcademySessionRecord,
  AcademyStudentRecord,
  AcademyStudentSubjectRecord,
} from "@/lib/academy-data";
import { getSupabaseServerClient } from "@/lib/supabase/server";

async function getPortalSupabaseClient() {
  return (await getSupabaseServerClient()) as any;
}

async function selectScopedList<T>(input: {
  table: string;
  column: string;
  value: string;
  orderColumn?: string;
}) {
  const supabase = await getPortalSupabaseClient();
  const query = supabase.from(input.table).select("*").eq(input.column, input.value);

  if (input.orderColumn) {
    query.order(input.orderColumn, { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as T[];
}

async function selectScopedSingle<T>(input: {
  table: string;
  id: string;
  scopeColumn: string;
  scopeValue: string;
}) {
  const supabase = await getPortalSupabaseClient();
  const { data, error } = await supabase
    .from(input.table)
    .select("*")
    .eq("id", input.id)
    .eq(input.scopeColumn, input.scopeValue)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as T | null;
}

function getUniqueNonEmptyValues(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean))) as string[];
}

export async function getParentPortalStudents(parentId: string) {
  return selectScopedList<AcademyStudentRecord>({
    table: "academy_students",
    column: "parent_id",
    value: parentId,
    orderColumn: "created_at",
  });
}

export async function getParentPortalStudentById(parentId: string, studentId: string) {
  return selectScopedSingle<AcademyStudentRecord>({
    table: "academy_students",
    id: studentId,
    scopeColumn: "parent_id",
    scopeValue: parentId,
  });
}

export async function getParentPortalSessions(parentId: string) {
  return selectScopedList<AcademySessionRecord>({
    table: "academy_sessions",
    column: "parent_id",
    value: parentId,
    orderColumn: "starts_at",
  });
}

export async function getParentPortalSessionById(parentId: string, sessionId: string) {
  return selectScopedSingle<AcademySessionRecord>({
    table: "academy_sessions",
    id: sessionId,
    scopeColumn: "parent_id",
    scopeValue: parentId,
  });
}

export async function getParentPortalPayments(parentId: string) {
  return selectScopedList<AcademyPaymentRecord>({
    table: "academy_payments",
    column: "parent_id",
    value: parentId,
    orderColumn: "created_at",
  });
}

export async function getParentPortalPaymentById(parentId: string, paymentId: string) {
  return selectScopedSingle<AcademyPaymentRecord>({
    table: "academy_payments",
    id: paymentId,
    scopeColumn: "parent_id",
    scopeValue: parentId,
  });
}

export async function getParentPortalValidatedSessionNotes(parentId: string) {
  const sessions = await getParentPortalSessions(parentId);
  const sessionIds = getUniqueNonEmptyValues(sessions.map((session) => session.id));

  if (!sessionIds.length) {
    return [] as AcademySessionNoteRecord[];
  }

  const supabase = await getPortalSupabaseClient();
  // Parent portal recaps stay restricted to the parent's own sessions and validated note states.
  const { data, error } = await supabase
    .from("academy_session_notes")
    .select("*")
    .in("session_id", sessionIds)
    .in("admin_status", ["validated", "emailed"])
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as AcademySessionNoteRecord[];
}

export async function getParentPortalRecordings(parentId: string) {
  const sessions = await getParentPortalSessions(parentId);
  const sessionIds = getUniqueNonEmptyValues(sessions.map((session) => session.id));

  if (!sessionIds.length) {
    return [] as AcademyRecordingRecord[];
  }

  const supabase = await getPortalSupabaseClient();
  // Recording visibility still respects the recording row flags after the parent scope is applied.
  const { data, error } = await supabase
    .from("academy_recordings")
    .select("*")
    .in("session_id", sessionIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as AcademyRecordingRecord[];
}

export async function getStudentPortalSessions(studentId: string) {
  return selectScopedList<AcademySessionRecord>({
    table: "academy_sessions",
    column: "student_id",
    value: studentId,
    orderColumn: "starts_at",
  });
}

export async function getStudentPortalSessionById(studentId: string, sessionId: string) {
  return selectScopedSingle<AcademySessionRecord>({
    table: "academy_sessions",
    id: sessionId,
    scopeColumn: "student_id",
    scopeValue: studentId,
  });
}

export async function getStudentPortalValidatedSessionNotes(studentId: string) {
  const sessions = await getStudentPortalSessions(studentId);
  const sessionIds = getUniqueNonEmptyValues(sessions.map((session) => session.id));

  if (!sessionIds.length) {
    return [] as AcademySessionNoteRecord[];
  }

  const supabase = await getPortalSupabaseClient();
  // Student recap visibility stays read-only and limited to validated Academy-approved notes.
  const { data, error } = await supabase
    .from("academy_session_notes")
    .select("*")
    .in("session_id", sessionIds)
    .in("admin_status", ["validated", "emailed"])
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as AcademySessionNoteRecord[];
}

export async function getTutorPortalSessions(tutorId: string) {
  return selectScopedList<AcademySessionRecord>({
    table: "academy_sessions",
    column: "tutor_id",
    value: tutorId,
    orderColumn: "starts_at",
  });
}

export async function getTutorPortalSessionById(tutorId: string, sessionId: string) {
  return selectScopedSingle<AcademySessionRecord>({
    table: "academy_sessions",
    id: sessionId,
    scopeColumn: "tutor_id",
    scopeValue: tutorId,
  });
}

export async function getPortalStudentSubjects(studentId: string) {
  return selectScopedList<AcademyStudentSubjectRecord>({
    table: "academy_student_subjects",
    column: "student_id",
    value: studentId,
    orderColumn: "created_at",
  });
}

export async function getTutorPortalStudentSubjects(tutorId: string, studentId: string) {
  const supabase = await getPortalSupabaseClient();
  const { data, error } = await supabase
    .from("academy_student_subjects")
    .select("*")
    .eq("student_id", studentId)
    .eq("tutor_id", tutorId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as AcademyStudentSubjectRecord[];
}

export async function getTutorPortalStudentById(tutorId: string, studentId: string) {
  const [subjects, sessions] = await Promise.all([
    getTutorPortalStudentSubjects(tutorId, studentId),
    getTutorPortalSessionsByStudentId(tutorId, studentId),
  ]);

  if (!subjects.length && !sessions.length) {
    return null;
  }

  const supabase = await getPortalSupabaseClient();
  const { data, error } = await supabase
    .from("academy_students")
    .select("*")
    .eq("id", studentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as AcademyStudentRecord | null;
}

export async function getTutorPortalSessionsByStudentId(tutorId: string, studentId: string) {
  const supabase = await getPortalSupabaseClient();
  const { data, error } = await supabase
    .from("academy_sessions")
    .select("*")
    .eq("student_id", studentId)
    .eq("tutor_id", tutorId)
    .order("starts_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as AcademySessionRecord[];
}

export async function getTutorPortalSessionNoteBySessionId(tutorId: string, sessionId: string) {
  const supabase = await getPortalSupabaseClient();
  const { data, error } = await supabase
    .from("academy_session_notes")
    .select("*")
    .eq("session_id", sessionId)
    .eq("tutor_id", tutorId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as AcademySessionNoteRecord | null;
}

export async function getTutorPortalSessionNotes(tutorId: string) {
  const supabase = await getPortalSupabaseClient();
  // Tutor note visibility stays locked to the tutor's own submissions and revisions only.
  const { data, error } = await supabase
    .from("academy_session_notes")
    .select("*")
    .eq("tutor_id", tutorId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as AcademySessionNoteRecord[];
}

export async function getTutorPortalStudents(tutorId: string) {
  const [subjects, sessions] = await Promise.all([
    selectScopedList<AcademyStudentSubjectRecord>({
      table: "academy_student_subjects",
      column: "tutor_id",
      value: tutorId,
      orderColumn: "created_at",
    }),
    getTutorPortalSessions(tutorId),
  ]);
  const studentIds = getUniqueNonEmptyValues([
    ...subjects.map((subject) => subject.student_id),
    ...sessions.map((session) => session.student_id),
  ]);

  if (!studentIds.length) {
    return [] as AcademyStudentRecord[];
  }

  const supabase = await getPortalSupabaseClient();
  const { data, error } = await supabase
    .from("academy_students")
    .select("*")
    .in("id", studentIds)
    .order("first_name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as AcademyStudentRecord[];
}

export async function getPortalValidatedSessionNote(sessionId: string) {
  const supabase = await getPortalSupabaseClient();
  const { data, error } = await supabase
    .from("academy_session_notes")
    .select("*")
    .eq("session_id", sessionId)
    .in("admin_status", ["validated", "emailed"])
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as AcademySessionNoteRecord | null;
}

export async function getPortalRecordingBySessionId(sessionId: string) {
  const supabase = await getPortalSupabaseClient();
  const { data, error } = await supabase
    .from("academy_recordings")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as AcademyRecordingRecord | null;
}
