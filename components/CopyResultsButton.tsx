import { useState } from "react";
import clsx from "clsx";

type Props = {
  onCopy: () => Promise<void> | void;
};

export function CopyResultsButton({ onCopy }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    await onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={clsx(
        "inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm transition hover:bg-slate-50"
      )}
    >
      {copied ? "Copied" : "Copy full critique"}
    </button>
  );
}

