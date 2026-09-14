export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-full flex-col justify-center bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">
            PM
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>

        <div className="card p-6 sm:p-7">{children}</div>

        {footer && <p className="mt-5 text-center text-sm text-slate-500">{footer}</p>}
      </div>
    </div>
  );
}
