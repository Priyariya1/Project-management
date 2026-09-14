import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { projectsApi, tasksApi } from '../api/endpoints';
import { useToast } from '../context/ToastContext';
import useDebouncedValue from '../hooks/useDebouncedValue';
import PageHeader from '../components/PageHeader';
import FilterBar from '../components/FilterBar';
import TaskItem from '../components/TaskItem';
import TaskForm from '../components/TaskForm';
import ProjectForm from '../components/ProjectForm';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import ProgressBar from '../components/ProgressBar';
import LoadingState, { SkeletonList } from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { ProjectStatusBadge } from '../components/Badge';
import { formatDate } from '../utils/format';
import { TASK_PRIORITIES, TASK_STATUSES } from '../utils/constants';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [project, setProject] = useState(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [projectError, setProjectError] = useState(null);

  const [tasks, setTasks] = useState([]);
  const [meta, setMeta] = useState(null);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);

  const loadProject = useCallback(async () => {
    setProjectLoading(true);
    setProjectError(null);
    try {
      const response = await projectsApi.get(id);
      setProject(response.data.project);
    } catch (err) {
      setProjectError(err.message);
    } finally {
      setProjectLoading(false);
    }
  }, [id]);

  const loadTasks = useCallback(async () => {
    setTasksLoading(true);
    setTasksError(null);
    try {
      const response = await projectsApi.tasks(id, {
        search: debouncedSearch || undefined,
        status: status || undefined,
        priority: priority || undefined,
        sortBy: 'created_at',
        sortOrder: 'desc',
        page,
        limit: 15,
      });
      setTasks(response.data.tasks);
      setMeta(response.meta);
    } catch (err) {
      setTasksError(err.message);
    } finally {
      setTasksLoading(false);
    }
  }, [id, debouncedSearch, status, priority, page]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => setPage(1), [debouncedSearch, status, priority]);

  const refreshAll = () => {
    loadProject();
    loadTasks();
  };

  const handleToggle = async (task, completed) => {
    setTogglingId(task.id);
    const previous = task.status;
    setTasks((current) =>
      current.map((item) => (item.id === task.id ? { ...item, status: completed ? 'completed' : 'pending' } : item)),
    );
    try {
      await tasksApi.setCompletion(task.id, completed);
      loadProject();
    } catch (err) {
      setTasks((current) => current.map((item) => (item.id === task.id ? { ...item, status: previous } : item)));
      toast.error(err.message);
    } finally {
      setTogglingId(null);
    }
  };

  const handleTaskSubmit = async (payload) => {
    if (editingTask) {
      await tasksApi.update(editingTask.id, payload);
      toast.success('Task updated');
    } else {
      await tasksApi.create(payload);
      toast.success('Task created');
    }
    setTaskFormOpen(false);
    setEditingTask(null);
    refreshAll();
  };

  const handleTaskDelete = async () => {
    try {
      await tasksApi.remove(deletingTask.id);
      toast.success('Task deleted');
      setDeletingTask(null);
      refreshAll();
    } catch (err) {
      toast.error(err.message);
      setDeletingTask(null);
    }
  };

  const handleProjectUpdate = async (payload) => {
    await projectsApi.update(id, payload);
    toast.success('Project updated');
    setEditProjectOpen(false);
    loadProject();
  };

  const handleProjectDelete = async () => {
    try {
      await projectsApi.remove(id);
      toast.success('Project deleted');
      navigate('/projects', { replace: true });
    } catch (err) {
      toast.error(err.message);
      setDeleteProjectOpen(false);
    }
  };

  if (projectLoading) return <LoadingState message="Loading project…" />;
  if (projectError) {
    return (
      <>
        <ErrorState message={projectError} onRetry={loadProject} />
        <div className="mt-4 text-center">
          <Link to="/projects" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            ← Back to projects
          </Link>
        </div>
      </>
    );
  }

  const hasFilters = Boolean(search || status || priority);

  return (
    <>
      <PageHeader
        breadcrumb={
          <nav className="mb-3 text-sm text-slate-500" aria-label="Breadcrumb">
            <Link to="/projects" className="hover:text-brand-600">Projects</Link>
            <span className="mx-2" aria-hidden="true">/</span>
            <span className="text-slate-700">{project.name}</span>
          </nav>
        }
        title={project.name}
        subtitle={project.description || 'No description provided.'}
        actions={
          <>
            <button type="button" className="btn-secondary" onClick={() => setEditProjectOpen(true)}>
              Edit project
            </button>
            <button type="button" className="btn-danger" onClick={() => setDeleteProjectOpen(true)}>
              Delete
            </button>
          </>
        }
      />

      <section className="card mb-5 grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Status</p>
          <div className="mt-1.5"><ProjectStatusBadge status={project.status} /></div>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Start date</p>
          <p className="mt-1.5 text-sm font-medium text-slate-900">{formatDate(project.startDate)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">End date</p>
          <p className="mt-1.5 text-sm font-medium text-slate-900">{formatDate(project.endDate)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Created</p>
          <p className="mt-1.5 text-sm font-medium text-slate-900">{formatDate(project.createdAt)}</p>
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <ProgressBar
            value={project.progress}
            label={`${project.completedTaskCount} of ${project.taskCount} tasks complete`}
          />
        </div>
      </section>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Tasks {meta ? <span className="text-sm font-normal text-slate-500">({meta.total})</span> : null}
        </h2>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setEditingTask(null);
            setTaskFormOpen(true);
          }}
        >
          + New task
        </button>
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search tasks in this project…"
        onReset={() => {
          setSearch('');
          setStatus('');
          setPriority('');
        }}
        filters={[
          { name: 'status', label: 'Status', value: status, onChange: setStatus, options: TASK_STATUSES },
          { name: 'priority', label: 'Priority', value: priority, onChange: setPriority, options: TASK_PRIORITIES },
        ]}
      />

      {tasksLoading ? (
        <SkeletonList rows={3} />
      ) : tasksError ? (
        <ErrorState message={tasksError} onRetry={loadTasks} />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon="✅"
          title={hasFilters ? 'No tasks match your filters' : 'No tasks in this project yet'}
          description={
            hasFilters ? 'Try a different search term or clear the filters.' : 'Break this project down into tasks.'
          }
          action={
            !hasFilters && (
              <button type="button" className="btn-primary" onClick={() => setTaskFormOpen(true)}>
                Add the first task
              </button>
            )
          }
        />
      ) : (
        <>
          <ul className="card divide-y divide-slate-100 overflow-hidden">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                showProject={false}
                toggling={togglingId === task.id}
                onToggle={handleToggle}
                onEdit={(item) => {
                  setEditingTask(item);
                  setTaskFormOpen(true);
                }}
                onDelete={setDeletingTask}
              />
            ))}
          </ul>
          <Pagination meta={meta} onChange={setPage} />
        </>
      )}

      <Modal
        open={taskFormOpen}
        title={editingTask ? 'Edit task' : 'New task'}
        description={`In project "${project.name}"`}
        onClose={() => {
          setTaskFormOpen(false);
          setEditingTask(null);
        }}
      >
        <TaskForm
          key={editingTask?.id ?? 'new'}
          task={editingTask}
          lockedProjectId={project.id}
          onSubmit={handleTaskSubmit}
          onCancel={() => {
            setTaskFormOpen(false);
            setEditingTask(null);
          }}
        />
      </Modal>

      <Modal
        open={editProjectOpen}
        title="Edit project"
        description="Update the details of this project."
        onClose={() => setEditProjectOpen(false)}
      >
        <ProjectForm project={project} onSubmit={handleProjectUpdate} onCancel={() => setEditProjectOpen(false)} />
      </Modal>

      <ConfirmDialog
        open={Boolean(deletingTask)}
        title="Delete task"
        message={`"${deletingTask?.name}" will be permanently deleted. This cannot be undone.`}
        onConfirm={handleTaskDelete}
        onCancel={() => setDeletingTask(null)}
      />

      <ConfirmDialog
        open={deleteProjectOpen}
        title="Delete project"
        message={`"${project.name}" and its ${project.taskCount} task(s) will be permanently deleted. This cannot be undone.`}
        onConfirm={handleProjectDelete}
        onCancel={() => setDeleteProjectOpen(false)}
      />
    </>
  );
}
