import useForm from '../hooks/useForm';
import FormField from './FormField';
import Spinner from './Spinner';
import { TASK_PRIORITIES, TASK_STATUSES } from '../utils/constants';
import { toDateInputValue } from '../utils/format';

export default function TaskForm({ task, projects = [], lockedProjectId, onSubmit, onCancel }) {
  const form = useForm({
    initialValues: {
      projectId: String(task?.projectId ?? lockedProjectId ?? projects[0]?.id ?? ''),
      name: task?.name ?? '',
      description: task?.description ?? '',
      priority: task?.priority ?? 'medium',
      status: task?.status ?? 'pending',
      dueDate: toDateInputValue(task?.dueDate),
    },
    validate: (values) => ({
      projectId: !values.projectId ? 'Please choose a project' : undefined,
      name:
        values.name.trim().length < 2
          ? 'Task name is required (at least 2 characters)'
          : values.name.trim().length > 150
            ? 'Task name must be at most 150 characters'
            : undefined,
      description:
        values.description.length > 5000 ? 'Description must be at most 5000 characters' : undefined,
    }),
    onSubmit: (values) =>
      onSubmit({
        projectId: Number(values.projectId),
        name: values.name.trim(),
        description: values.description.trim() || null,
        priority: values.priority,
        status: values.status,
        dueDate: values.dueDate || null,
      }),
  });

  const showProjectPicker = !lockedProjectId;

  return (
    <form onSubmit={form.handleSubmit} noValidate className="space-y-4">
      {form.formError && (
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {form.formError}
        </div>
      )}

      {showProjectPicker && (
        <FormField label="Project" error={form.errors.projectId} required>
          {(props) => (
            <select {...props} name="projectId" value={form.values.projectId} onChange={form.handleChange}>
              <option value="" disabled>Select a project…</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          )}
        </FormField>
      )}

      <FormField label="Task name" error={form.errors.name} required>
        {(props) => (
          <input
            {...props}
            type="text"
            name="name"
            placeholder="e.g. Draft the launch checklist"
            value={form.values.name}
            onChange={form.handleChange}
          />
        )}
      </FormField>

      <FormField label="Description" error={form.errors.description}>
        {(props) => (
          <textarea
            {...props}
            name="description"
            rows={3}
            placeholder="Any extra detail…"
            value={form.values.description}
            onChange={form.handleChange}
          />
        )}
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField label="Priority" error={form.errors.priority} required>
          {(props) => (
            <select {...props} name="priority" value={form.values.priority} onChange={form.handleChange}>
              {TASK_PRIORITIES.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          )}
        </FormField>

        <FormField label="Status" error={form.errors.status} required>
          {(props) => (
            <select {...props} name="status" value={form.values.status} onChange={form.handleChange}>
              {TASK_STATUSES.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          )}
        </FormField>

        <FormField label="Due date" error={form.errors.dueDate}>
          {(props) => (
            <input {...props} type="date" name="dueDate" value={form.values.dueDate} onChange={form.handleChange} />
          )}
        </FormField>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={form.submitting}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={form.submitting}>
          {form.submitting ? <Spinner className="h-4 w-4" label="Saving…" /> : task ? 'Save changes' : 'Create task'}
        </button>
      </div>
    </form>
  );
}
