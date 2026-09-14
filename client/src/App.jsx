import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute, { PublicOnlyRoute } from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import TasksPage from './pages/TasksPage';
import NotFoundPage from './pages/NotFoundPage';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              <Route element={<PublicOnlyRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/projects/:id" element={<ProjectDetailPage />} />
                  <Route path="/tasks" element={<TasksPage />} />
                </Route>
              </Route>

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
