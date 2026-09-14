import useForm from '../hooks/useForm';
import FormField from './FormField';
import Spinner from './Spinner';
import { PROJECT_STATUSES } from '../utils/constants';
import { toDateInputValue } from '../utils/format';

export default function ProjectForm({ project, onSubmit, onCancel }) {
  const form = useForm({
    initialValues: {
      name: project?.name ?? '',
      description: project?.description ?? '',
      status: project?.status ?? 'not_started',
      startDate: toDateInputValue(project?.startDate),
      endDate: toDateInputValue(project?.endDate),
    },
    validate: (values) => ({
      name:
        values.name.trim().length < 2
          ? 'Project name is required (at least 2 characters)'
          : values.name.trim().length > 150
            ? 'Project name must be at most 150 characters'
            : undefined,
      description:
        values.description.length > 5000 ? 'Description must be at most 5000 characters' : undefined,
      endDate:
        values.startDate && values.endDate && values.endDate < values.startDate
          ? 'End date must be on or after the start date'
          : undefined,
    }),
    onSubmit: (values) =>
      onSubmit({
        name: values.name.trim(),
        description: values.description.trim() || null,
        status: values.status,
        startDate: values.startDate || null,
        endDate: values.endDate || null,
      }),
  });

  return (
    <form onSubmit={form.handleSubmit} noValidate className="space-y-4">
      {form.formError && (
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {form.formError}
        </div>
      )}

      <FormField label="Project name" error={form.errors.name} required>
        {(props) => (
          <input
            {...props}
            type="text"
            name="name"
            placeholder="e.g. Website Redesign"
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
            placeholder="What is this project about?"
            value={form.values.description}
            onChange={form.handleChange}
          />
        )}
      </FormField>

      <FormField label="Status" error={form.errors.status} required>
        {(props) => (
          <select {...props} name="status" value={form.values.status} onChange={form.handleChange}>
            {PROJECT_STATUSES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Start date" error={form.errors.startDate}>
          {(props) => (
            <input
              {...props}
              type="date"
              name="startDate"
              value={form.values.startDate}
              onChange={form.handleChange}
            />
          )}
        </FormField>

        <FormField label="End date" error={form.errors.endDate}>
          {(props) => (
            <input
              {...props}
              type="date"
              name="endDate"
              value={form.values.endDate}
              onChange={form.handleChange}
            />
          )}
        </FormField>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={form.submitting}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={form.submitting}>
          {form.submitting ? (
            <Spinner className="h-4 w-4" label="Saving…" />
          ) : project ? (
            'Save changes'
          ) : (
            'Create project'
          )}
        </button>
      </div>
    </form>
  );
}
