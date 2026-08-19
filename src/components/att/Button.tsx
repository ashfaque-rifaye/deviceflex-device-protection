// AT&T button primitive.
//
// Geometry and states come from att.com's live styles: 48px tall (40px small),
// fully rounded, 2px border on both variants so a primary and a secondary line up
// when placed side by side, and a 0.2s transition. The one counter-intuitive bit —
// buttons get *lighter* on hover (#00388F → #0057B8) — lives in the utility classes
// in styles.css so it applies to every existing `btn-primary` call site too.
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "inverse" | "on-dark";
export type ButtonSize = "lg" | "sm";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  inverse: "btn-primary btn-inverse",
  "on-dark": "btn-secondary btn-on-dark",
};

type Common = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  /** Rendered before the label — keep to 16px line icons. */
  icon?: ReactNode;
  /** Rendered after the label. A trailing chevron is the AT&T convention. */
  trailingIcon?: ReactNode;
  children: ReactNode;
  className?: string;
};

export const buttonClass = ({
  variant = "primary",
  size = "lg",
  block,
  className,
}: Pick<Common, "variant" | "size" | "block" | "className">) =>
  cn(VARIANT[variant], size === "sm" && "att-btn-sm", block && "att-btn-block", className);

export type ButtonProps = Common &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className">;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, block, icon, trailingIcon, children, className, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClass({ variant, size, block, className })}
      {...rest}
    >
      {icon}
      {children}
      {trailingIcon}
    </button>
  );
});

/** Same visual button, rendered as a router link. Use for navigation, not actions. */
export function ButtonLink({
  to,
  search,
  params,
  variant,
  size,
  block,
  icon,
  trailingIcon,
  children,
  className,
}: Common & {
  to: string;
  search?: Record<string, unknown>;
  params?: Record<string, string>;
}) {
  return (
    <Link
      to={to}
      search={search as never}
      params={params as never}
      className={buttonClass({ variant, size, block, className })}
    >
      {icon}
      {children}
      {trailingIcon}
    </Link>
  );
}
