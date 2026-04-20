import { Reveal } from "@/components/reveal";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <Reveal className="mx-auto mb-12 max-w-3xl text-center">
      {eyebrow ? (
        <p className="text-base font-semibold tracking-tight text-foreground/85">{eyebrow}</p>
      ) : null}
      <h2
        className={`text-3xl font-semibold tracking-tight text-foreground md:text-4xl ${
          eyebrow ? "mt-4" : ""
        }`}
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
    </Reveal>
  );
}
