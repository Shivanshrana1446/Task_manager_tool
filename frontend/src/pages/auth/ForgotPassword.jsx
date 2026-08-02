import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MailCheck } from 'lucide-react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { forgotPasswordSchema } from '../../validation/authSchemas';
import { useForgotPassword } from '../../hooks/useAuthMutations';

const ForgotPassword = () => {
  const forgotPasswordMutation = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = (values) => {
    forgotPasswordMutation.mutate(values);
  };

  if (forgotPasswordMutation.isSuccess) {
    return (
      <Card>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <MailCheck className="mx-auto mb-4 text-primary-600" size={40} />
          <h1 className="mb-1 text-xl font-semibold text-foreground">Check your email</h1>
          <p className="mb-6 text-sm text-foreground/60">
            If that email is registered, we&apos;ve sent a link to reset your password.
          </p>
          <Link to="/login" className="text-sm font-medium text-primary-600 hover:underline">
            Back to sign in
          </Link>
        </motion.div>
      </Card>
    );
  }

  return (
    <Card>
      <h1 className="mb-1 text-xl font-semibold text-foreground">Forgot your password?</h1>
      <p className="mb-6 text-sm text-foreground/60">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      <div className="mb-4">
        <Alert variant="error">{forgotPasswordMutation.error?.response?.data?.message}</Alert>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Button type="submit" isLoading={forgotPasswordMutation.isPending}>
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-foreground/60">
        Remembered your password?{' '}
        <Link to="/login" className="font-medium text-primary-600 hover:underline">
          Sign in
        </Link>
      </p>
    </Card>
  );
};

export default ForgotPassword;
