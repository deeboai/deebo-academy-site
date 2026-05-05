type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-border/80 bg-background/45 px-6 py-14 text-center">
      <p className="workspace-eyebrow">Nothing Here Yet</p>
      <h4 className="mt-3 text-lg font-medium text-foreground">{title}</h4>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
