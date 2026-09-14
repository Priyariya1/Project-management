import { useCallback, useState } from 'react';

export default function useForm({ initialValues, validate, onSubmit }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const setValue = useCallback((name, value) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current));
  }, []);

  const handleChange = useCallback(
    (event) => {
      const { name, value, type, checked } = event.target;
      setValue(name, type === 'checkbox' ? checked : value);
    },
    [setValue],
  );

  const reset = useCallback(
    (nextValues = initialValues) => {
      setValues(nextValues);
      setErrors({});
      setFormError(null);
    },
    [initialValues],
  );

  const handleSubmit = useCallback(
    async (event) => {
      event?.preventDefault?.();
      setFormError(null);

      const validationErrors = validate ? validate(values) : {};
      const activeErrors = Object.fromEntries(
        Object.entries(validationErrors).filter(([, message]) => Boolean(message)),
      );

      if (Object.keys(activeErrors).length > 0) {
        setErrors(activeErrors);
        return;
      }

      setSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        if (error?.fieldErrors && Object.keys(error.fieldErrors).length > 0) {
          setErrors(error.fieldErrors);
        }
        setFormError(error?.message || 'Something went wrong. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
    [validate, values, onSubmit],
  );

  return { values, errors, formError, submitting, setValue, setValues, setErrors, setFormError, handleChange, handleSubmit, reset };
}
