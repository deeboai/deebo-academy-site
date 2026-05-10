import Link from "next/link";

import { resendAcademyEmailLogAction } from "@/actions/academy-os-admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { EmptyState } from "@/components/admin/empty-state";
import { SectionCard } from "@/components/admin/section-card";
import {
  listAcademyEmailLogs,
  listAcademyIntakeSubmissions,
  listAcademyPortalAccounts,
  listAcademySessionNotes,
  listAcademySessions,
  listAcademyStudents,
} from "@/lib/academy-data";
import { requireAcademyAdminUser } from "@/lib/auth/academy-admin";
import { getAcademyEmailTemplatePreviews } from "@/lib/email";

const RESENDABLE_TEMPLATES = new Set([
  "portal-invite",
  "portal-password-reset",
  "intake-confirmation",
  "intake-notification",
  "session-scheduled",
  "session-recap",
]);

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not sent";
  }

  return new Date(value).toLocaleString();
}

function getRelatedRecordHref(input: { relatedType: string | null; relatedId: string | null }) {
  if (!input.relatedType || !input.relatedId) {
    return null;
  }

  switch (input.relatedType) {
    case "intake":
      return `/admin/intake/${input.relatedId}`;
    case "portal_account":
      return "/admin/access";
    case "session":
      return `/admin/sessions/${input.relatedId}`;
    case "session_note":
      return `/admin/session-notes/${input.relatedId}`;
    default:
      return null;
  }
}

export default async function AcademyAdminEmailsPage() {
  const user = await requireAcademyAdminUser();
  const [logs, intakes, accounts, sessions, notes, students] = await Promise.all([
    listAcademyEmailLogs(),
    listAcademyIntakeSubmissions(),
    listAcademyPortalAccounts(),
    listAcademySessions(),
    listAcademySessionNotes(),
    listAcademyStudents(),
  ]);
  const templatePreviews = getAcademyEmailTemplatePreviews();
  const recentLogs = logs.slice(0, 50);

  return (
    <AdminShell
      title="Email Operations"
      subtitle="Review delivery history, preview live templates, and resend supported Academy emails from one place."
      userEmail={user.email ?? "Authenticated user"}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <SectionCard
          title="Recent delivery log"
          description="The latest 50 Academy email events recorded in academy_email_logs."
        >
          {recentLogs.length ? (
            <div className="space-y-4">
              {recentLogs.map((log) => {
                const relatedHref = getRelatedRecordHref({
                  relatedType: log.related_type,
                  relatedId: log.related_id,
                });
                // Resolve the linked record inline so the log can point admins back to the workflow that produced it.
                const relatedAccount = log.related_type === "portal_account"
                  ? accounts.find((account) => account.id === log.related_id)
                  : null;
                const relatedIntake = log.related_type === "intake"
                  ? intakes.find((intake) => intake.id === log.related_id)
                  : null;
                const relatedSession = log.related_type === "session"
                  ? sessions.find((session) => session.id === log.related_id)
                  : null;
                const relatedNote = log.related_type === "session_note"
                  ? notes.find((note) => note.id === log.related_id)
                  : null;
                const relatedNoteSession = relatedNote
                  ? sessions.find((session) => session.id === relatedNote.session_id)
                  : null;
                const relatedSessionStudent = relatedSession
                  ? students.find((student) => student.id === relatedSession.student_id)
                  : null;
                const relatedNoteStudent = relatedNoteSession
                  ? students.find((student) => student.id === relatedNoteSession.student_id)
                  : null;
                const relatedLabel =
                  relatedAccount
                    ? `${relatedAccount.role} · ${relatedAccount.email}`
                    : relatedIntake
                      ? `Intake · ${relatedIntake.parent_full_name}`
                      : relatedSession
                        ? `Session · ${relatedSession.subject}${relatedSessionStudent ? ` for ${relatedSessionStudent.first_name}` : ""}`
                        : relatedNoteSession
                          ? `Session recap · ${relatedNoteSession.subject}${relatedNoteStudent ? ` for ${relatedNoteStudent.first_name}` : ""}`
                          : log.related_type && log.related_id
                            ? `${log.related_type} · ${log.related_id}`
                            : "No linked record";

                return (
                  <article key={log.id} className="record-row">
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
                      <div>
                        <p className="workspace-eyebrow">{log.template}</p>
                        <h3 className="mt-2 text-base font-semibold text-foreground">{log.subject}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">{log.recipient}</p>
                        <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                          <p>Status: {log.status}</p>
                          <p>Sent: {formatDateTime(log.sent_at)}</p>
                          <p>Logged: {formatDateTime(log.created_at)}</p>
                          <p>Linked: {relatedLabel}</p>
                        </div>
                        {log.error_message ? (
                          <p className="mt-3 text-sm text-rose-400">{log.error_message}</p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2 xl:justify-end">
                        {relatedHref ? (
                          <Link href={relatedHref} className="secondary-button px-4 py-2">
                            Open record
                          </Link>
                        ) : null}
                        {RESENDABLE_TEMPLATES.has(log.template) ? (
                          <form action={resendAcademyEmailLogAction}>
                            <input type="hidden" name="log_id" value={log.id} />
                            <button type="submit" className="secondary-button px-4 py-2">
                              Resend
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No email logs yet"
              description="Academy invite, intake, session, and recap emails will appear here once the workflows start sending."
            />
          )}
        </SectionCard>

        <SectionCard
          title="Template previews"
          description="These previews render the same live templates the Academy workflows use."
        >
          <div className="space-y-6">
            {templatePreviews.map((preview) => (
              <article key={preview.id} className="rounded-3xl border border-border/70 bg-background/50 p-5">
                <div className="space-y-2">
                  <p className="workspace-eyebrow">{preview.label}</p>
                  <h3 className="text-base font-semibold text-foreground">{preview.subject}</h3>
                  <p className="text-sm text-muted-foreground">{preview.description}</p>
                </div>
                {/* Render the live HTML template output directly so admins can audit copy and structure without sending test mail. */}
                <div
                  className="mt-4 rounded-2xl border border-border/70 bg-white p-4 text-sm text-slate-900"
                  dangerouslySetInnerHTML={{ __html: preview.html }}
                />
              </article>
            ))}
          </div>
        </SectionCard>
      </div>
    </AdminShell>
  );
}
