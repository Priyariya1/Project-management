export default function ProgressBar({ value, label, className = '' }) {
  const clamped = Math.min(100, Math.max(0, Math.round(value || 0)));
  const tone = clamped === 100 ? 'bg-emerald-500' : clamped >= 50 ? 'bg-brand-500' : 'bg-amber-500';

  return (
    <div className={className}>
      {label && (
        <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
          <span>{label}</span>
          <span className="font-medium tabular-nums text-slate-700">{clamped}%</span>
        </div>
      )}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Progress'}
      >
        <div className={`h-full rounded-full transition-all duration-500 ${tone}`} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
