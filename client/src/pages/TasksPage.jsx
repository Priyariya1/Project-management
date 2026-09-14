import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { projectsApi, tasksApi } from '../api/endpoints';
import { useToast } from '../context/ToastContext';
import useDebouncedValue from '../hooks/useDebouncedValue';
import PageHeader from '../components/PageHeader';
import FilterBar from '../components/FilterBar';
import TaskItem from '../components/TaskItem';
import TaskForm from '../components/TaskForm';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import { SkeletonList } from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { TASK_PRIORITIES, TASK_STATUSES } from '../utils/constants';

export default function TasksPage() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tasks, setTasks] = useState([]);
  const [meta, setMeta] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [projectId, setProjectId] = useState('');
  const [sort, setSort] = useState('created_at:desc');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(() => searchParams.get('new') === '1');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => setPage(1), [debouncedSearch, status, priority, projectId, sort]);

  useEffect(() => {
    projectsApi
      .list({ limit: 100, sortBy: 'name', sortOrder: 'asc' })
      .then((response) => setProjects(response.data.projects))
      .catch(() => setProjects([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [sortBy, sortOrder] = sort.split(':');
    try {
      const response = await tasksApi.list({
        search: debouncedSearch || undefined,
        status: status || undefined,
        priority: priority || undefined,
        projectId: projectId || undefined,
        sortBy,
        sortOrder,
        page,
        limit: 15,
      });
      setTasks(response.data.tasks);
      setMeta(response.meta);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status, priority, projectId, sort, page]);

  useEffect(() => {
    load();
  }, [load]);

  const refreshProjects = () =>
    projectsApi
      .list({ limit: 100, sortBy: 'name', sortOrder: 'asc' })
      .then((response) => setProjects(response.data.projects))
      .catch(() => {});

  const handleToggle = async (task, completed) => {
    setTogglingId(task.id);
    const previous = task.status;
    setTasks((current) =>
      current.map((item) => (item.id === task.id ? { ...item, status: completed ? 'completed' : 'pending' } : item)),
    );
    try {
      await tasksApi.setCompletion(task.id, completed);
      toast.success(completed ? 'Task completed' : 'Task reopened');
    } catch (err) {
      setTasks((current) =>
        current.map((item) => (item.id === task.id ? { ...item, status: previous } : item)),
      );
      toast.error(err.message);
    } finally {
      setTogglingId(null);
    }
  };

  const handleSubmit = async (payload) => {
    if (editing) {
      await tasksApi.update(editing.id, payload);
      toast.success('Task updated');
    } else {
      await tasksApi.create(payload);
      toast.success('Task created');
    }
    setFormOpen(false);
    setEditing(null);
    load();
  };

  const handleDelete = async () => {
    try {
      await tasksApi.remove(deleting.id);
      toast.success(`"${deleting.name}" was deleted`);
      setDeleting(null);
      if (tasks.length === 1 && page > 1) setPage((current) => current - 1);
      else load();
    } catch (err) {
      toast.error(err.message);
      setDeleting(null);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setStatus('');
    setPriority('');
    setProjectId('');
  };

  const hasFilters = Boolean(search || status || priority || projectId);
  const noProjects = projects.length === 0;

  return (
    <>
      <PageHeader
        title="Tasks"
        subtitle={meta ? `${meta.total} task${meta.total === 1 ? '' : 's'}` : 'All of your tasks'}
        actions={
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            disabled={noProjects}
            title={noProjects ? 'Create a project first' : undefined}
          >
            + New task
          </button>
        }
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search tasks by name…"
        onReset={resetFilters}
        filters={[
          { name: 'status', label: 'Status', value: status, onChange: setStatus, options: TASK_STATUSES },
          { name: 'priority', label: 'Priority', value: priority, onChange: setPriority, options: TASK_PRIORITIES },
          {
            name: 'project',
            label: 'Project',
            value: projectId,
            onChange: setProjectId,
            options: projects.map((project) => ({ value: String(project.id), label: project.name })),
          },
        ]}
      >
        <div className="w-full lg:w-44">
          <label htmlFor="task-sort" className="label">Sort by</label>
          <select id="task-sort" className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="created_at:desc">Newest first</option>
            <option value="created_at:asc">Oldest first</option>
            <option value="due_date:asc">Due date (soonest)</option>
            <option value="priority:desc">Priority (high first)</option>
            <option value="name:asc">Name (A–Z)</option>
          </select>
        </div>
      </FilterBar>

      {loading ? (
        <SkeletonList rows={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon="✅"
          title={hasFilters ? 'No tasks match your filters' : noProjects ? 'Create a project first' : 'No tasks yet'}
          description={
            hasFilters
              ? 'Try a different search term or clear the filters.'
              : noProjects
                ? 'Tasks live inside projects, so start by creating one.'
                : 'Add your first task to start tracking progress.'
          }
          action={
            hasFilters ? (
              <button type="button" className="btn-secondary" onClick={resetFilters}>Clear filters</button>
            ) : !noProjects ? (
              <button type="button" className="btn-primary" onClick={() => setFormOpen(true)}>Create a task</button>
            ) : null
          }
        />
      ) : (
        <>
          <ul className="card divide-y divide-slate-100 overflow-hidden">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                toggling={togglingId === task.id}
                onToggle={handleToggle}
                onEdit={(item) => {
                  setEditing(item);
                  setFormOpen(true);
                }}
                onDelete={setDeleting}
              />
            ))}
          </ul>
          <Pagination meta={meta} onChange={setPage} />
        </>
      )}

      <Modal
        open={formOpen}
        title={editing ? 'Edit task' : 'New task'}
        description={editing ? 'Update the details of this task.' : 'Add a task to one of your projects.'}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
      >
        <TaskForm
          key={editing?.id ?? 'new'}
          task={editing}
          projects={projects}
          onSubmit={async (payload) => {
            await handleSubmit(payload);
            refreshProjects();
          }}
          onCancel={() => {
            setFormOpen(false);
            setEditing(null);
          }}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete task"
        message={`"${deleting?.name}" will be permanently deleted. This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
