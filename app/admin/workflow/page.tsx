import Link from "next/link";

import { AdminShell } from "@/components/admin/admin-shell";
import { EmptyState } from "@/components/admin/empty-state";
import { SectionCard } from "@/components/admin/section-card";
import { requireAcademyAdminUser } from "@/lib/auth/academy-admin";
import { getAcademyWorkflowQueues } from "@/lib/academy-workflow";

export default async function AcademyAdminWorkflowPage() {
  const user = await requireAcademyAdminUser();
  const workflowQueues = await getAcademyWorkflowQueues();

  return (
    <AdminShell
      title="Workflow"
      subtitle="Run the Academy critical path from one place: intake, conversion, tutor assignment, scheduling, note review, and recap follow-through."
      userEmail={user.email ?? "Authenticated user"}
    >
      <div className="grid gap-6">
        {workflowQueues.map((queue) => (
          <SectionCard
            key={queue.id}
            title={queue.title}
            description={queue.description}
          >
            {queue.items.length ? (
              <div className="space-y-4">
                {queue.items.map((item) => (
                  <article key={item.id} className="record-row">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                        <p className="mt-2 text-sm text-muted-foreground">{item.detail}</p>
                      </div>
                      <Link href={item.href} className="secondary-button px-4 py-2">
                        Open
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Queue clear"
                description={queue.emptyMessage}
              />
            )}
          </SectionCard>
        ))}
      </div>
    </AdminShell>
  );
}
