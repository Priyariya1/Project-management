import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import ProgressBar from '../components/ProgressBar';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { ProjectStatusBadge, PriorityBadge } from '../components/Badge';
import { formatDate, isOverdue, relativeDueLabel } from '../utils/format';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await dashboardApi.stats();
      setStats(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingState message="Loading your dashboard…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const { projects, tasks, completionRate, recentProjects, upcomingTasks } = stats;

  return (
    <>
      <PageHeader
        title={`Hello, ${user?.fullName?.split(' ')[0] ?? 'there'}`}
        subtitle="Here is how your work is tracking right now."
        actions={
          <>
            <Link to="/projects?new=1" className="btn-primary">New project</Link>
            <Link to="/tasks?new=1" className="btn-secondary">New task</Link>
          </>
        }
      />

      <section aria-label="Summary statistics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Projects" value={projects.total} icon="🗂️" tone="brand" />
        <StatCard label="Total Tasks" value={tasks.total} icon="📝" tone="slate" />
        <StatCard label="Completed Tasks" value={tasks.completed} icon="✅" tone="emerald" />
        <StatCard label="Pending Tasks" value={tasks.pending} icon="⏳" tone="amber" />
        <StatCard label="Projects In Progress" value={projects.inProgress} icon="🚀" tone="sky" />
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-1">
          <h2 className="text-sm font-semibold text-slate-900">Overall task completion</h2>
          <p className="mt-3 text-3xl font-bold tabular-nums text-slate-900">{completionRate}%</p>
          <ProgressBar value={completionRate} className="mt-3" />
          <dl className="mt-5 space-y-2 text-sm">
            {[
              ['Completed', tasks.completed, 'text-emerald-600'],
              ['In progress', tasks.inProgress, 'text-sky-600'],
              ['Pending', tasks.pending, 'text-amber-600'],
              ['Overdue', tasks.overdue, 'text-rose-600'],
            ].map(([label, value, tone]) => (
              <div key={label} className="flex items-center justify-between">
                <dt className="text-slate-500">{label}</dt>
                <dd className={`font-semibold tabular-nums ${tone}`}>{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Recent projects</h2>
            <Link to="/projects" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              View all
            </Link>
          </div>

          {recentProjects.length === 0 ? (
            <EmptyState
              icon="🗂️"
              title="No projects yet"
              description="Create your first project to start tracking work."
              action={<Link to="/projects?new=1" className="btn-primary">Create a project</Link>}
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentProjects.map((project) => (
                <li key={project.id}>
                  <Link
                    to={`/projects/${project.id}`}
                    className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-3 transition hover:bg-slate-50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-900">{project.name}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {formatDate(project.startDate)} → {formatDate(project.endDate)}
                      </span>
                    </span>
                    <ProjectStatusBadge status={project.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="card mt-4 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Upcoming deadlines</h2>
          <Link to="/tasks" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            View all tasks
          </Link>
        </div>

        {upcomingTasks.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            Nothing due right now. Tasks with a due date will appear here.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {upcomingTasks.map((task) => {
              const overdue = isOverdue(task.dueDate, task.status);
              return (
                <li key={task.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{task.name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      <Link to={`/projects/${task.projectId}`} className="hover:text-brand-600">
                        {task.projectName}
                      </Link>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={task.priority} />
                    <span
                      className={`text-xs font-medium ${overdue ? 'text-rose-600' : 'text-slate-500'}`}
                    >
                      {relativeDueLabel(task.dueDate)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
