const TONES = {
  brand: 'bg-brand-50 text-brand-700',
  slate: 'bg-slate-100 text-slate-700',
  amber: 'bg-amber-50 text-amber-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  rose: 'bg-rose-50 text-rose-700',
  sky: 'bg-sky-50 text-sky-700',
};

export default function StatCard({ label, value, icon, tone = 'brand', hint }) {
  return (
    <div className="card flex h-full items-start gap-4 p-5">
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-lg ${TONES[tone] ?? TONES.brand}`}
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-0.5 text-2xl font-bold tabular-nums text-slate-900">{value}</p>
        {hint && <p className="mt-0.5 truncate text-xs text-slate-400">{hint}</p>}
      </div>
    </div>
  );
}
