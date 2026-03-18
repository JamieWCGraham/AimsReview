import { TextareaHTMLAttributes } from "react";
import clsx from "clsx";

type Props = {
  label: string;
  error?: string | null;
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

export function AimInput({ label, error, className, ...rest }: Props) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-800">
        {label}
      </label>
      <textarea
        className={clsx(
          "min-h-[220px] w-full resize-vertical rounded-md border bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600",
          error
            ? "border-red-400 focus-visible:ring-red-500"
            : "border-slate-300",
          className
        )}
        {...rest}
      />
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

