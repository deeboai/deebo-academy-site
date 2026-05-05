type SectionCardProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
}: SectionCardProps) {
  return (
    <section
      className={`min-w-0 rounded-[1.75rem] border border-border/70 bg-card/90 p-6 ${
        className ?? ""
      }`}
    >
      <div className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="workspace-eyebrow">Section</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground">{title}</h3>
          {description ? (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="min-w-0 pt-5">{children}</div>
    </section>
  );
}
