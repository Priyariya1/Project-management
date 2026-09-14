import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { projectsApi } from '../api/endpoints';
import { useToast } from '../context/ToastContext';
import useDebouncedValue from '../hooks/useDebouncedValue';
import PageHeader from '../components/PageHeader';
import FilterBar from '../components/FilterBar';
import ProjectCard from '../components/ProjectCard';
import ProjectForm from '../components/ProjectForm';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Pagination from '../components/Pagination';
import { SkeletonList } from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { PROJECT_STATUSES } from '../utils/constants';

export default function ProjectsPage() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [projects, setProjects] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
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

  useEffect(() => setPage(1), [debouncedSearch, status, sort]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [sortBy, sortOrder] = sort.split(':');
    try {
      const response = await projectsApi.list({
        search: debouncedSearch || undefined,
        status: status || undefined,
        sortBy,
        sortOrder,
        page,
        limit: 9,
      });
      setProjects(response.data.projects);
      setMeta(response.meta);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status, sort, page]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (project) => {
    setEditing(project);
    setFormOpen(true);
  };

  const handleSubmit = async (payload) => {
    if (editing) {
      await projectsApi.update(editing.id, payload);
      toast.success('Project updated');
    } else {
      await projectsApi.create(payload);
      toast.success('Project created');
    }
    setFormOpen(false);
    setEditing(null);
    load();
  };

  const handleDelete = async () => {
    try {
      await projectsApi.remove(deleting.id);
      toast.success(`"${deleting.name}" was deleted`);
      setDeleting(null);
      if (projects.length === 1 && page > 1) setPage((current) => current - 1);
      else load();
    } catch (err) {
      toast.error(err.message);
      setDeleting(null);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setStatus('');
  };

  return (
    <>
      <PageHeader
        title="Projects"
        subtitle={meta ? `${meta.total} project${meta.total === 1 ? '' : 's'}` : 'Your projects'}
        actions={
          <button type="button" className="btn-primary" onClick={openCreate}>
            + New project
          </button>
        }
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search projects by name…"
        onReset={resetFilters}
        filters={[
          { name: 'status', label: 'Status', value: status, onChange: setStatus, options: PROJECT_STATUSES },
        ]}
      >
        <div className="w-full lg:w-48">
          <label htmlFor="project-sort" className="label">Sort by</label>
          <select id="project-sort" className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="created_at:desc">Newest first</option>
            <option value="created_at:asc">Oldest first</option>
            <option value="name:asc">Name (A–Z)</option>
            <option value="name:desc">Name (Z–A)</option>
            <option value="end_date:asc">End date (soonest)</option>
          </select>
        </div>
      </FilterBar>

      {loading ? (
        <SkeletonList rows={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : projects.length === 0 ? (
        <EmptyState
          icon="🗂️"
          title={search || status ? 'No projects match your filters' : 'No projects yet'}
          description={
            search || status
              ? 'Try a different search term or clear the filters.'
              : 'Create your first project to start organising tasks.'
          }
          action={
            search || status ? (
              <button type="button" className="btn-secondary" onClick={resetFilters}>Clear filters</button>
            ) : (
              <button type="button" className="btn-primary" onClick={openCreate}>Create a project</button>
            )
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} onEdit={openEdit} onDelete={setDeleting} />
            ))}
          </div>
          <Pagination meta={meta} onChange={setPage} />
        </>
      )}

      <Modal
        open={formOpen}
        title={editing ? 'Edit project' : 'New project'}
        description={editing ? 'Update the details of this project.' : 'Give your project a name and a timeline.'}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
      >
        <ProjectForm
          key={editing?.id ?? 'new'}
          project={editing}
          onSubmit={handleSubmit}
          onCancel={() => {
            setFormOpen(false);
            setEditing(null);
          }}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete project"
        message={`"${deleting?.name}" and all of its tasks will be permanently deleted. This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
