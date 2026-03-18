export function LoadingState() {
  return (
    <div className="flex items-center space-x-3 text-sm text-slate-600">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
      <span>Running reviewer-style analysis…</span>
    </div>
  );
}

