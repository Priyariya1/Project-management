import { Link } from 'react-router-dom';
import { ProjectStatusBadge } from './Badge';
import ProgressBar from './ProgressBar';
import { formatDate } from '../utils/format';

export default function ProjectCard({ project, onEdit, onDelete }) {
  return (
    <article className="card flex h-full flex-col p-5 transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <Link to={`/projects/${project.id}`} className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-slate-900 hover:text-brand-700">
            {project.name}
          </h3>
        </Link>
        <ProjectStatusBadge status={project.status} />
      </div>

      <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm text-slate-500">
        {project.description || 'No description provided.'}
      </p>

      <ProgressBar
        className="mt-4"
        value={project.progress}
        label={`${project.completedTaskCount}/${project.taskCount} tasks complete`}
      />

      <dl className="mt-4 grid grid-cols-2 gap-4 text-xs">
        <div>
          <dt className="text-slate-400">Start</dt>
          <dd className="mt-0.5 font-medium text-slate-700">{formatDate(project.startDate)}</dd>
        </div>
        <div>
          <dt className="text-slate-400">End</dt>
          <dd className="mt-0.5 font-medium text-slate-700">{formatDate(project.endDate)}</dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <Link
          to={`/projects/${project.id}`}
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          View details →
        </Link>
        <div className="flex items-center gap-1">
          <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={() => onEdit(project)}>
            Edit
          </button>
          <button
            type="button"
            className="btn-ghost px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
            onClick={() => onDelete(project)}
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
