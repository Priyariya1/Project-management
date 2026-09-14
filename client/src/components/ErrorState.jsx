export default function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="card flex flex-col items-center gap-3 border-rose-200 bg-rose-50/60 p-8 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-100 text-xl">!</div>
      <p className="text-sm font-medium text-rose-900">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary">
          Try again
        </button>
      )}
    </div>
  );
}
