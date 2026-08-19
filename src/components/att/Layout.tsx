// Layout and surface primitives.
//
// Container width and gutters follow att.com: content caps at 1324px with 16/24/40px
// gutters at mobile/tablet/desktop. Cards use their 1px #DCDFE3 hairline at rest and
// lift to the level-2 three-layer shadow on hover — they don't ship a resting shadow
// on content cards, which is what gives their pages the flat, roomy feel.
import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Container({
  as: Tag = "div",
  width = "default",
  className,
  children,
  ...rest
}: {
  as?: ElementType;
  width?: "default" | "narrow" | "wide";
  className?: string;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "children" | "className">) {
  return (
    <Tag
      className={cn(
        "att-container",
        width === "narrow" && "max-w-[var(--att-container-narrow)]",
        width === "wide" && "max-w-[var(--att-container-wide)]",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** A page band. `tone` picks one of AT&T's four section fills. */
export function Section({
  tone = "white",
  className,
  children,
  ...rest
}: {
  tone?: "white" | "gray" | "pale" | "deep";
  className?: string;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "children" | "className">) {
  const tones = {
    white: "bg-white",
    gray: "bg-[var(--color-att-gray)]",
    pale: "bg-[var(--color-att-pale)]",
    deep: "bg-[var(--color-att-deep)] text-white",
  } as const;
  return (
    <section className={cn("att-section", tones[tone], className)} {...rest}>
      {children}
    </section>
  );
}

export function Card({
  interactive,
  className,
  children,
  ...rest
}: {
  interactive?: boolean;
  className?: string;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, "children" | "className">) {
  return (
    <div className={cn("att-card", interactive && "att-card-hover", className)} {...rest}>
      {children}
    </div>
  );
}

/** Small uppercase label that sits above a heading. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("att-eyebrow", className)}>{children}</p>;
}
