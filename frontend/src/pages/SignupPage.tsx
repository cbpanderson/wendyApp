import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ApiError } from '../api/client';
import { register as registerApi } from '../api/auth';
import { useAuth } from '../auth/AuthContext';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  handle: z
    .string()
    .min(1, 'Handle is required')
    .regex(
      /^[a-zA-Z0-9_]{3,30}$/,
      'Handle must be 3-30 characters; letters, numbers, underscores only'
    ),
  zipCode: z
    .string()
    .min(1, 'ZIP is required')
    .regex(/^[0-9]{5}$/, 'ZIP must be 5 digits'),
  bio: z.string().max(500, 'Bio must be 500 characters or fewer').optional(),
  confirmedAdult: z
    .literal(true, { errorMap: () => ({ message: 'You must confirm you are 18 or older' }) }),
});

type FormValues = z.infer<typeof schema>;

export default function SignupPage() {
  const navigate = useNavigate();
  const { loginWithResponse } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isValid, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      handle: '',
      zipCode: '98382',
      bio: '',
      confirmedAdult: false as unknown as true,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      const res = await registerApi(values);
      loginWithResponse(res);
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'EMAIL_IN_USE') {
          setError('email', { message: 'Email is already in use' });
        } else if (err.code === 'HANDLE_IN_USE') {
          setError('handle', { message: 'Handle is already taken' });
        } else if (err.code === 'INVALID_ZIP') {
          setError('zipCode', { message: 'ZIP not supported in this version' });
        } else {
          setServerError(err.message);
        }
      } else {
        setServerError('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 6 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create your account
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Sequim, WA only in v1.
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack spacing={2}>
            {serverError && <Alert severity="error">{serverError}</Alert>}

            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
              required
              fullWidth
            />

            <TextField
              label="Password"
              type="password"
              autoComplete="new-password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message ?? 'At least 8 characters'}
              required
              fullWidth
            />

            <TextField
              label="Handle"
              {...register('handle')}
              error={!!errors.handle}
              helperText={
                errors.handle?.message ?? 'Public name, 3-30 chars (letters, numbers, _)'
              }
              required
              fullWidth
            />

            <TextField
              label="ZIP"
              {...register('zipCode')}
              error={!!errors.zipCode}
              helperText={errors.zipCode?.message ?? 'Sequim is 98382'}
              required
              fullWidth
            />

            <TextField
              label="Bio (optional)"
              multiline
              rows={3}
              {...register('bio')}
              error={!!errors.bio}
              helperText={errors.bio?.message}
              fullWidth
            />

            <FormControlLabel
              control={<Checkbox {...register('confirmedAdult')} />}
              label="I confirm I am 18 or older"
            />
            {errors.confirmedAdult && (
              <Typography variant="caption" color="error">
                {errors.confirmedAdult.message}
              </Typography>
            )}

            <Button
              type="submit"
              variant="contained"
              disabled={!isValid || isSubmitting}
              size="large"
            >
              {isSubmitting ? 'Creating account…' : 'Sign up'}
            </Button>
          </Stack>
        </form>
      </Box>
    </Container>
  );
}
