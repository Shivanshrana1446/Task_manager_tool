import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Card from '../../components/ui/Card';
import PasswordInput from '../../components/ui/PasswordInput';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { resetPasswordSchema } from '../../validation/authSchemas';
import { useResetPassword } from '../../hooks/useAuthMutations';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const resetPasswordMutation = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async (values) => {
    try {
      await resetPasswordMutation.mutateAsync({ token, ...values });
      navigate('/login', { replace: true, state: { resetSuccess: true } });
    } catch {
      // surfaced via resetPasswordMutation.error below
    }
  };

  return (
    <Card>
      <h1 className="mb-1 text-xl font-semibold text-foreground">Set a new password</h1>
      <p className="mb-6 text-sm text-foreground/60">Choose a strong password for your account.</p>

      <div className="mb-4">
        <Alert variant="error">{resetPasswordMutation.error?.response?.data?.message}</Alert>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <PasswordInput
          label="New password"
          autoComplete="new-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />
        <PasswordInput
          label="Confirm new password"
          autoComplete="new-password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" isLoading={resetPasswordMutation.isPending}>
          Reset password
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-foreground/60">
        <Link to="/login" className="font-medium text-primary-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </Card>
  );
};

export default ResetPassword;
