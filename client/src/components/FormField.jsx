import { useId } from 'react';

export default function FormField({ label, error, hint, required, children, className = '' }) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
        {required && <span className="ml-0.5 text-rose-500" aria-hidden="true">*</span>}
      </label>
      {children({
        id,
        'aria-invalid': error ? 'true' : undefined,
        'aria-describedby': [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined,
        className: `input ${error ? 'input-error' : ''}`,
      })}
      {hint && !error && (
        <p id={hintId} className="mt-1 text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1 text-xs font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
