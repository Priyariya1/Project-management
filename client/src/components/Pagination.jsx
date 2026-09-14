export default function Pagination({ meta, onChange }) {
  if (!meta || meta.totalPages <= 1) return null;

  const { page, totalPages, total, limit } = meta;
  const first = (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);

  return (
    <nav
      className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row"
      aria-label="Pagination"
    >
      <p className="text-sm text-slate-500">
        Showing <span className="font-medium text-slate-700">{first}</span>–
        <span className="font-medium text-slate-700">{last}</span> of{' '}
        <span className="font-medium text-slate-700">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn-secondary px-3 py-1.5"
          onClick={() => onChange(page - 1)}
          disabled={!meta.hasPreviousPage}
        >
          Previous
        </button>
        <span className="px-1 text-sm text-slate-500">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          className="btn-secondary px-3 py-1.5"
          onClick={() => onChange(page + 1)}
          disabled={!meta.hasNextPage}
        >
          Next
        </button>
      </div>
    </nav>
  );
}
