export default function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  filters = [],
  onReset,
  children,
}) {
  const hasActiveFilter = Boolean(search) || filters.some((filter) => filter.value);

  return (
    <div className="card mb-5 flex flex-col gap-3 p-4 lg:flex-row lg:items-end">
      <div className="flex-1">
        <label htmlFor="filter-search" className="label">Search</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">
            🔍
          </span>
          <input
            id="filter-search"
            type="search"
            className="input pl-9"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      </div>

      {filters.map((filter) => (
        <div key={filter.name} className="w-full lg:w-44">
          <label htmlFor={`filter-${filter.name}`} className="label">{filter.label}</label>
          <select
            id={`filter-${filter.name}`}
            className="input"
            value={filter.value}
            onChange={(event) => filter.onChange(event.target.value)}
          >
            <option value="">All</option>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ))}

      {children}

      {hasActiveFilter && onReset && (
        <button type="button" className="btn-secondary lg:mb-0" onClick={onReset}>
          Clear
        </button>
      )}
    </div>
  );
}
