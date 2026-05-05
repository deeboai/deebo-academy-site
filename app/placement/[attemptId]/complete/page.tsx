import { SectionCard } from "@/components/admin/section-card";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function PlacementCompletePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-16">
        <SectionCard
          title="Placement exam submitted"
          description="Your placement exam has been received. Deebo Academy will review the result and follow up with the next recommendation."
        >
          <div className="mb-6 flex justify-end">
            <ThemeToggle />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Multiple-choice responses are scored automatically. Free-response items are reviewed with AI assistance and then finalized by an Academy administrator.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
