import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.97]";

    const variants = {
      primary:
        "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500 shadow-sm shadow-blue-100",
      secondary:
        "bg-slate-100 text-slate-700 hover:bg-slate-200 focus-visible:ring-slate-400",
      danger:
        "bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-400 shadow-sm shadow-red-100",
      ghost:
        "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-300",
      outline:
        "border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 focus-visible:ring-slate-300",
    };

    const sizes = {
      sm: "text-xs px-3 py-2 h-8",
      md: "text-sm px-4 py-2.5 h-10",
      lg: "text-sm px-6 py-3 h-11",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
