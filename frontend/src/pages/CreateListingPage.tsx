import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
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
  createListing,
  getCategories,
  uploadPhoto,
} from '../api/listings';
import PhotoPicker from '../components/PhotoPicker';

const schema = z.object({
  categoryId: z.string().min(1, 'Choose a category'),
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be 100 characters or fewer'),
  description: z.string().max(2000, 'Description must be 2000 characters or fewer'),
  offerType: z.enum(['TRADE_ONLY', 'GIFT_ONLY', 'EITHER']),
});

type FormValues = z.infer<typeof schema>;

export default function CreateListingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      categoryId: '',
      title: '',
      description: '',
      offerType: 'EITHER',
    },
  });

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      const created = await createListing(values);
      for (let i = 0; i < photos.length && i < 2; i++) {
        try {
          await uploadPhoto(created.id, photos[i], i as 0 | 1);
        } catch (err) {
          if (err instanceof ApiError) setServerError(err.message);
          break;
        }
      }
      navigate('/me/listings', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) setServerError(err.message);
      else setServerError('Something went wrong. Please try again.');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 6 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create a listing
        </Typography>
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
              SelectProps={{ native: false }}
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
              helperText={errors.title?.message ?? '5–100 characters'}
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
              <RadioGroup row defaultValue="EITHER">
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

            <PhotoPicker files={photos} onChange={setPhotos} />

            <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create listing'}
            </Button>
          </Stack>
        </form>
      </Box>
    </Container>
  );
}
