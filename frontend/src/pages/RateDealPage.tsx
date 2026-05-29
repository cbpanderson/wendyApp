import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import { getDeal } from '../api/deals';
import { submitRating } from '../api/ratings';
import { ApiError } from '../api/client';
import type { Deal } from '../api/deals';

export default function RateDealPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [stars, setStars] = useState<number | null>(null);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const { data: deal, isLoading } = useQuery<Deal>({
    queryKey: ['deal', id],
    queryFn: () => getDeal(id!),
    enabled: !!id && isAuthenticated,
  });

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <Container>
        <Typography sx={{ py: 4 }}>Loading…</Typography>
      </Container>
    );
  }

  if (!deal) {
    return (
      <Container>
        <Typography sx={{ py: 4 }}>Deal not found.</Typography>
      </Container>
    );
  }

  const callerHandle = user?.handle;
  const otherParty =
    callerHandle === deal.participantA.handle
      ? deal.participantB
      : deal.participantA;

  const handleSubmit = async () => {
    if (!stars) {
      setError('Please select a star rating.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitRating(id!, stars, review.trim() || undefined);
      navigate(`/users/${otherParty.handle}`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setError('You have already submitted a rating for this deal.');
        } else if (err.status === 400) {
          setError('Cannot rate this deal. It may not be completed yet.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 6 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Leave a rating
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Rating @{otherParty.handle}
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography component="legend" gutterBottom>
            Stars (1–5)
          </Typography>
          <ToggleButtonGroup
            exclusive
            value={stars}
            onChange={(_, newValue) => { if (newValue !== null) setStars(newValue); }}
            aria-label="star rating"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <ToggleButton key={n} value={n} aria-label={`${n} star`}>
                {n} ⭐
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        <TextField
          label="Review (optional)"
          multiline
          rows={4}
          fullWidth
          inputProps={{ maxLength: 1000 }}
          value={review}
          onChange={(e) => setReview(e.target.value)}
          sx={{ mb: 2 }}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
        >
          Submit rating
        </Button>
      </Box>
    </Container>
  );
}
