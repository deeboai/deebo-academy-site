import { AdminShell } from "@/components/admin/admin-shell";
import { EmptyState } from "@/components/admin/empty-state";
import { SectionCard } from "@/components/admin/section-card";
import Link from "next/link";
import {
  listAcademyPortalAccounts,
  listAcademyParents,
  listAcademyStudents,
  listAcademyTutors,
} from "@/lib/academy-data";
import { requireAcademyAdminUser } from "@/lib/auth/academy-admin";
import {
  createAcademyAdminPortalAccountAction,
  disableAcademyPortalAccountAction,
  enableAcademyPortalAccountAction,
  inviteAcademyPortalAccountAction,
  revokeAcademyPortalAccountSessionsAction,
  sendAcademyPortalPasswordResetAction,
} from "@/actions/academy-os-admin";

function formatDateTime(value: string | null) {
  if (!value) {
    return "Never";
  }

  return new Date(value).toLocaleString();
}

export default async function AcademyAdminAccessPage() {
  const user = await requireAcademyAdminUser();
  const [accounts, parents, tutors, students] = await Promise.all([
    listAcademyPortalAccounts(),
    listAcademyParents(),
    listAcademyTutors(),
    listAcademyStudents(),
  ]);

  return (
    <AdminShell
      title="Portal Access"
      subtitle="Manage Academy portal roles, invite status, password reset emails, forced re-auth, and disabled accounts."
      userEmail={user.email ?? "Authenticated user"}
    >
      <div className="mb-6 flex justify-end">
        <Link href="/admin/emails" className="secondary-button px-4 py-2">
          Open email log
        </Link>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
        <SectionCard
          title="Add admin"
          description="Create admin access after the first admin has been bootstrapped in Supabase."
        >
          <form action={createAcademyAdminPortalAccountAction} className="space-y-4">
            <div>
              <label className="field-label">Admin email</label>
              <input name="email" type="email" className="field-input" required />
            </div>
            <button type="submit" className="primary-button">
              Save admin access
            </button>
          </form>
        </SectionCard>

        <SectionCard
          title="Access records"
          description="Each row links one email and role to the Academy record that grants portal access. Revoking sessions forces the next Academy portal request to sign in again."
        >
        {accounts.length ? (
          <div className="space-y-4">
            {accounts.map((account) => {
              const linkedParent = parents.find((parent) => parent.id === account.parent_id);
              const linkedTutor = tutors.find((tutor) => tutor.id === account.tutor_id);
              const linkedStudent = students.find((student) => student.id === account.student_id);
              const linkedName =
                linkedParent?.full_name ??
                linkedTutor?.full_name ??
                (linkedStudent
                  ? `${linkedStudent.first_name} ${linkedStudent.last_name ?? ""}`.trim()
                  : "Admin access");

              return (
                <article key={account.id} className="record-row">
                  <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
                    <div>
                      <p className="workspace-eyebrow">{account.role}</p>
                      <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                        {linkedName}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">{account.email}</p>
                      <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                        <p>Status: {account.status}</p>
                        <p>Invite: {formatDateTime(account.invite_sent_at)}</p>
                        <p>Reset: {formatDateTime(account.password_reset_sent_at)}</p>
                        <p>Last login: {formatDateTime(account.last_login_at)}</p>
                        <p>Forced re-auth: {formatDateTime(account.force_reauth_after ?? null)}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 xl:justify-end">
                      <form action={inviteAcademyPortalAccountAction}>
                        <input type="hidden" name="account_id" value={account.id} />
                        <button type="submit" className="secondary-button px-4 py-2">
                          {account.invite_sent_at ? "Resend invite" : "Send invite"}
                        </button>
                      </form>
                      <form action={sendAcademyPortalPasswordResetAction}>
                        <input type="hidden" name="account_id" value={account.id} />
                        <button type="submit" className="secondary-button px-4 py-2">
                          Reset password
                        </button>
                      </form>
                      <form action={revokeAcademyPortalAccountSessionsAction}>
                        <input type="hidden" name="account_id" value={account.id} />
                        <button type="submit" className="secondary-button px-4 py-2">
                          Revoke sessions
                        </button>
                      </form>
                      {account.status === "disabled" ? (
                        <form action={enableAcademyPortalAccountAction}>
                          <input type="hidden" name="account_id" value={account.id} />
                          <button type="submit" className="primary-button px-4 py-2">
                            Enable
                          </button>
                        </form>
                      ) : (
                        <form action={disableAcademyPortalAccountAction}>
                          <input type="hidden" name="account_id" value={account.id} />
                          <button type="submit" className="secondary-button px-4 py-2">
                            Disable
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No portal access records"
            description="Run the portal account migration and bootstrap the first admin access row before using this page."
          />
        )}
        </SectionCard>
      </div>
    </AdminShell>
  );
}
