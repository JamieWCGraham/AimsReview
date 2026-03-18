type Props = {
  title: string;
  children: React.ReactNode;
};

export function SectionCard({ title, children }: Props) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="mt-2 text-sm text-slate-800">{children}</div>
    </section>
  );
}

