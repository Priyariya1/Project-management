import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useForm from '../hooks/useForm';
import FormField from '../components/FormField';
import Spinner from '../components/Spinner';
import AuthLayout from '../components/AuthLayout';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function passwordProblem(password) {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter';
  if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain a number';
  return undefined;
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const form = useForm({
    initialValues: { fullName: '', email: '', password: '', confirmPassword: '' },
    validate: (values) => ({
      fullName:
        values.fullName.trim().length < 2 ? 'Please enter your full name (at least 2 characters)' : undefined,
      email: !values.email.trim()
        ? 'Email is required'
        : !EMAIL_PATTERN.test(values.email.trim())
          ? 'Please enter a valid email address'
          : undefined,
      password: passwordProblem(values.password),
      confirmPassword:
        values.confirmPassword !== values.password ? 'Passwords do not match' : undefined,
    }),
    onSubmit: async (values) => {
      const user = await register({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      toast.success(`Account created. Welcome, ${user.fullName.split(' ')[0]}!`);
      navigate('/dashboard', { replace: true });
    },
  });

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start organising your projects in a couple of minutes."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={form.handleSubmit} noValidate className="space-y-4">
        {form.formError && (
          <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {form.formError}
          </div>
        )}

        <FormField label="Full name" error={form.errors.fullName} required>
          {(props) => (
            <input
              {...props}
              type="text"
              name="fullName"
              autoComplete="name"
              placeholder="Ada Lovelace"
              value={form.values.fullName}
              onChange={form.handleChange}
            />
          )}
        </FormField>

        <FormField label="Email address" error={form.errors.email} required>
          {(props) => (
            <input
              {...props}
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.values.email}
              onChange={form.handleChange}
            />
          )}
        </FormField>

        <FormField
          label="Password"
          error={form.errors.password}
          hint="At least 8 characters, with an uppercase letter, a lowercase letter and a number."
          required
        >
          {(props) => (
            <input
              {...props}
              type="password"
              name="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={form.values.password}
              onChange={form.handleChange}
            />
          )}
        </FormField>

        <FormField label="Confirm password" error={form.errors.confirmPassword} required>
          {(props) => (
            <input
              {...props}
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              placeholder="••••••••"
              value={form.values.confirmPassword}
              onChange={form.handleChange}
            />
          )}
        </FormField>

        <button type="submit" className="btn-primary w-full" disabled={form.submitting}>
          {form.submitting ? <Spinner className="h-4 w-4" label="Creating account…" /> : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
}
