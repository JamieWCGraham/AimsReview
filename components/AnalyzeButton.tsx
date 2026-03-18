import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};

export function AnalyzeButton({ loading, className, children, ...rest }: Props) {
  return (
    <button
      type="button"
      disabled={loading || rest.disabled}
      className={clsx(
        "inline-flex items-center justify-center rounded-md border border-transparent bg-sky-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-400",
        className
      )}
      {...rest}
    >
      {loading ? "Analyzing…" : children}
    </button>
  );
}

