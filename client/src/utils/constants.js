export const PROJECT_STATUSES = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

export const TASK_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

export const TASK_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export const PROJECT_STATUS_STYLES = {
  not_started: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200',
  in_progress: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200',
  completed: 'bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200',
};

export const TASK_STATUS_STYLES = {
  pending: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200',
  in_progress: 'bg-sky-50 text-sky-800 ring-1 ring-inset ring-sky-200',
  completed: 'bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200',
};

export const PRIORITY_STYLES = {
  low: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200',
  medium: 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200',
  high: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
};

export const labelFor = (options, value) =>
  options.find((option) => option.value === value)?.label ?? value;
