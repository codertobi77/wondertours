import { cn } from "@/lib/utils";
import { sanitizeHtmlBrOnly } from "@/lib/sanitize";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  className?: string;
  align?: "left" | "center" | "right";
}

export function SectionHeading({
  title,
  subtitle,
  className,
  align = "center",
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mb-12",
        {
          "text-center": align === "center",
          "text-left": align === "left",
          "text-right": align === "right",
        },
        className
      )}
    >
      {subtitle && (
        <p className="mb-3 text-sm font-medium uppercase tracking-wider text-accent">
          {subtitle}
        </p>
      )}
      <h2 className="font-heading text-3xl font-bold text-text md:text-4xl lg:text-5xl" dangerouslySetInnerHTML={{ __html: sanitizeHtmlBrOnly(title) }}>
      </h2>
    </div>
  );
}
