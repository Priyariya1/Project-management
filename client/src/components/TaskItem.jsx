import { Link } from 'react-router-dom';
import { PriorityBadge, TaskStatusBadge } from './Badge';
import Spinner from './Spinner';
import { formatDate, isOverdue, relativeDueLabel } from '../utils/format';

export default function TaskItem({ task, onToggle, onEdit, onDelete, showProject = true, toggling = false }) {
  const completed = task.status === 'completed';
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <li className="flex items-start gap-3 px-4 py-3 transition hover:bg-slate-50">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center pt-0.5">
        {toggling ? (
          <Spinner className="h-4 w-4 text-brand-600" />
        ) : (
          <input
            type="checkbox"
            checked={completed}
            onChange={(event) => onToggle(task, event.target.checked)}
            className="h-4 w-4 cursor-pointer rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            aria-label={completed ? `Reopen ${task.name}` : `Mark ${task.name} as completed`}
          />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
          {task.name}
        </p>

        {task.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{task.description}</p>
        )}

        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <PriorityBadge priority={task.priority} />
          <TaskStatusBadge status={task.status} />

          {showProject && task.projectName && (
            <Link
              to={`/projects/${task.projectId}`}
              className="text-xs text-slate-500 underline-offset-2 hover:text-brand-600 hover:underline"
            >
              {task.projectName}
            </Link>
          )}

          {task.dueDate && (
            <span className={`text-xs ${overdue ? 'font-medium text-rose-600' : 'text-slate-500'}`}>
              {formatDate(task.dueDate)}
              {!completed && ` · ${relativeDueLabel(task.dueDate)}`}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={() => onEdit(task)}>
          Edit
        </button>
        <button
          type="button"
          className="btn-ghost px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"
          onClick={() => onDelete(task)}
        >
          Delete
        </button>
      </div>
    </li>
  );
}
