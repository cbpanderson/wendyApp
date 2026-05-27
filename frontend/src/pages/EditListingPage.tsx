import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Alert,
  Box,
  Button,
  Container,
  FormControl,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/client';
import {
  Category,
  getCategories,
  getListing,
  updateListing,
} from '../api/listings';

const schema = z.object({
  categoryId: z.string().min(1),
  title: z.string().min(5).max(100),
  description: z.string().max(2000),
  offerType: z.enum(['TRADE_ONLY', 'GIFT_ONLY', 'EITHER']),
});

type FormValues = z.infer<typeof schema>;

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { categoryId: '', title: '', description: '', offerType: 'EITHER' },
  });

  useEffect(() => {
    if (!id) return;
    Promise.all([getCategories(), getListing(id)])
      .then(([cats, listing]) => {
        setCategories(cats);
        reset({
          categoryId: listing.category.id,
          title: listing.title,
          description: listing.description,
          offerType: listing.offerType,
        });
      })
      .catch(() => setServerError('Could not load listing.'))
      .finally(() => setLoading(false));
  }, [id, reset]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!id) return <Navigate to="/me/listings" replace />;

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await updateListing(id, values);
      navigate('/me/listings', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) setServerError(err.message);
      else setServerError('Could not save changes.');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 6 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Edit listing
        </Typography>
        {loading ? (
          <Typography>Loading…</Typography>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack spacing={2}>
              {serverError && <Alert severity="error">{serverError}</Alert>}

              <TextField
                select
                label="Category"
                defaultValue=""
                {...register('categoryId')}
                error={!!errors.categoryId}
                helperText={errors.categoryId?.message}
                required
                fullWidth
              >
                <MenuItem value="" disabled>
                  Choose a category
                </MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Title"
                {...register('title')}
                error={!!errors.title}
                helperText={errors.title?.message}
                required
                fullWidth
              />

              <TextField
                label="Description"
                multiline
                rows={4}
                {...register('description')}
                error={!!errors.description}
                helperText={errors.description?.message}
                fullWidth
              />

              <FormControl>
                <FormLabel>What's on offer?</FormLabel>
                <RadioGroup row>
                  <FormControlLabel
                    value="TRADE_ONLY"
                    control={<Radio {...register('offerType')} value="TRADE_ONLY" />}
                    label="Trade only"
                  />
                  <FormControlLabel
                    value="GIFT_ONLY"
                    control={<Radio {...register('offerType')} value="GIFT_ONLY" />}
                    label="Gift only"
                  />
                  <FormControlLabel
                    value="EITHER"
                    control={<Radio {...register('offerType')} value="EITHER" />}
                    label="Either"
                  />
                </RadioGroup>
              </FormControl>

              <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Save'}
              </Button>
            </Stack>
          </form>
        )}
      </Box>
    </Container>
  );
}
