import Spinner from './Spinner';

export default function LoadingState({ message = 'Loading…', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-16 text-slate-500 ${className}`}>
      <Spinner className="h-8 w-8 text-brand-600" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function SkeletonList({ rows = 3 }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="card animate-pulse p-5">
          <div className="h-4 w-1/3 rounded bg-slate-200" />
          <div className="mt-3 h-3 w-2/3 rounded bg-slate-100" />
          <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
