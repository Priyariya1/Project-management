import {
  PRIORITY_STYLES,
  PROJECT_STATUSES,
  PROJECT_STATUS_STYLES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_STATUS_STYLES,
  labelFor,
} from '../utils/constants';

export function ProjectStatusBadge({ status }) {
  return (
    <span className={`badge ${PROJECT_STATUS_STYLES[status] ?? PROJECT_STATUS_STYLES.not_started}`}>
      {labelFor(PROJECT_STATUSES, status)}
    </span>
  );
}

export function TaskStatusBadge({ status }) {
  return (
    <span className={`badge ${TASK_STATUS_STYLES[status] ?? TASK_STATUS_STYLES.pending}`}>
      {labelFor(TASK_STATUSES, status)}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  return (
    <span className={`badge ${PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.medium}`}>
      {labelFor(TASK_PRIORITIES, priority)}
    </span>
  );
}
