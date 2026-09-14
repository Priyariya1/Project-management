import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingState from './LoadingState';

export default function ProtectedRoute() {
  const { isAuthenticated, initialising } = useAuth();
  const location = useLocation();

  if (initialising) {
    return <LoadingState message="Checking your session…" className="min-h-screen" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { isAuthenticated, initialising } = useAuth();

  if (initialising) {
    return <LoadingState message="Loading…" className="min-h-screen" />;
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
}
