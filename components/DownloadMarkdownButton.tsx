import clsx from "clsx";

type Props = {
  onDownload: () => Promise<void> | void;
};

export function DownloadMarkdownButton({ onDownload }: Props) {
  return (
    <button
      type="button"
      onClick={onDownload}
      className={clsx(
        "inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm transition hover:bg-slate-50"
      )}
    >
      Download as markdown
    </button>
  );
}

