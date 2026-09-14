import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useForm from '../hooks/useForm';
import FormField from '../components/FormField';
import Spinner from '../components/Spinner';
import AuthLayout from '../components/AuthLayout';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const redirectTo = location.state?.from?.pathname || '/dashboard';

  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: (values) => ({
      email: !values.email.trim()
        ? 'Email is required'
        : !EMAIL_PATTERN.test(values.email.trim())
          ? 'Please enter a valid email address'
          : undefined,
      password: !values.password ? 'Password is required' : undefined,
    }),
    onSubmit: async (values) => {
      const user = await login({ email: values.email.trim(), password: values.password });
      toast.success(`Welcome back, ${user.fullName.split(' ')[0]}!`);
      navigate(redirectTo, { replace: true });
    },
  });

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to pick up where you left off."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
            Create one
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

        <FormField label="Password" error={form.errors.password} required>
          {(props) => (
            <input
              {...props}
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={form.values.password}
              onChange={form.handleChange}
            />
          )}
        </FormField>

        <button type="submit" className="btn-primary w-full" disabled={form.submitting}>
          {form.submitting ? <Spinner className="h-4 w-4" label="Signing in…" /> : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  );
}
