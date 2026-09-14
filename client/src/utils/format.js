export function formatDate(value, { fallback = '—' } = {}) {
  if (!value) return fallback;
  const date = new Date(typeof value === 'string' && value.length === 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function toDateInputValue(value) {
  if (!value) return '';
  const date = new Date(typeof value === 'string' && value.length === 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function isOverdue(dueDate, status) {
  if (!dueDate || status === 'completed') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${toDateInputValue(dueDate)}T00:00:00`) < today;
}

export function relativeDueLabel(dueDate) {
  if (!dueDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${toDateInputValue(dueDate)}T00:00:00`);
  const days = Math.round((due - today) / 86_400_000);
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days === -1) return '1 day overdue';
  if (days < 0) return `${Math.abs(days)} days overdue`;
  return `Due in ${days} days`;
}

export function initialsOf(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}
