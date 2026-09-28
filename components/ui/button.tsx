import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  // "default" : alias du style "primary" (convention shadcn/ui utilisée par
  // la pagination) — conserve l'API maison inchangée pour le reste du site.
  variant?: "primary" | "secondary" | "outline" | "ghost" | "default";
  size?: "sm" | "md" | "lg" | "icon";
  href?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", href, children, ...props }, ref) => {
    const buttonClasses = cn(
      "inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      {
        "bg-amber-600 text-white hover:bg-amber-700 shadow-lg shadow-amber-600/25":
          variant === "primary" || variant === "default",
        "bg-secondary text-text hover:bg-secondary/90": variant === "secondary",
        "border-2 border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white": variant === "outline",
        "text-text hover:bg-text/5": variant === "ghost",
        "px-4 py-2 text-sm": size === "sm",
        "px-6 py-3 text-base": size === "md",
        "px-8 py-4 text-lg": size === "lg",
        "w-10 h-10 p-0": size === "icon",
      },
      className
    );

    if (href) {
      return (
        <Link href={href} className={buttonClasses}>
          {children}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        className={buttonClasses}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
