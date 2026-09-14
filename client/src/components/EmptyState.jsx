export default function EmptyState({ icon = '📋', title, description, action }) {
  return (
    <div className="card flex flex-col items-center gap-3 p-10 text-center">
      <div className="text-4xl" aria-hidden="true">{icon}</div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description && <p className="max-w-sm text-sm text-slate-500">{description}</p>}
      {action}
    </div>
  );
}
