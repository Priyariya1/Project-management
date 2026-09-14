import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-20 text-center">
      <p className="text-6xl font-bold text-brand-600">404</p>
      <h1 className="mt-3 text-xl font-semibold text-slate-900">Page not found</h1>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/dashboard" className="btn-primary mt-6">
        Back to dashboard
      </Link>
    </div>
  );
}
