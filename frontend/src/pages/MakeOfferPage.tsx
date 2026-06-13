import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
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
import { getListing, getMyListings, Listing } from '../api/listings';
import { createOffer, OfferKind } from '../api/offers';
import { useToast } from '../components/ToastProvider';

export default function MakeOfferPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [target, setTarget] = useState<Listing | null>(null);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [offerType, setOfferType] = useState<OfferKind>('TRADE');
  const [offeredListingId, setOfferedListingId] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getListing(id), getMyListings(100, 0)])
      .then(([l, page]) => {
        if (cancelled) return;
        setTarget(l);
        setMyListings(page.items.filter((x) => x.status === 'ACTIVE'));
        // Default the offer type based on what the listing allows.
        if (l.offerType === 'GIFT_ONLY') setOfferType('GIFT_REQUEST');
        else setOfferType('TRADE');
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not load listing.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (loading) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (loadError || !target) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ py: 6 }}>
          <Alert severity="warning">{loadError ?? 'Listing not found.'}</Alert>
        </Box>
      </Container>
    );
  }

  const tradeAllowed = target.offerType === 'TRADE_ONLY' || target.offerType === 'EITHER';
  const giftAllowed = target.offerType === 'GIFT_ONLY' || target.offerType === 'EITHER';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (offerType === 'TRADE' && !offeredListingId) {
      setServerError('Choose one of your listings to offer.');
      return;
    }
    setSubmitting(true);
    try {
      await createOffer(id, {
        offerType,
        offeredListingId: offerType === 'TRADE' ? offeredListingId : null,
        message: message.trim() === '' ? undefined : message,
      });
      showToast('Offer sent!', 'success');
      navigate('/me/offers?direction=sent', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) setServerError(err.message);
      else setServerError('Could not submit offer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 6 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Make an offer
        </Typography>

        <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1, mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary">
            For listing
          </Typography>
          <Typography variant="h6">{target.title}</Typography>
          <Typography variant="body2" color="text.secondary">
            by @{target.owner.handle}
          </Typography>
        </Box>

        <form onSubmit={onSubmit} noValidate>
          <Stack spacing={2}>
            {serverError && <Alert severity="error">{serverError}</Alert>}

            <FormControl>
              <FormLabel id="offer-kind-label">What kind of offer?</FormLabel>
              <RadioGroup
                aria-labelledby="offer-kind-label"
                value={offerType}
                onChange={(e) => setOfferType(e.target.value as OfferKind)}
              >
                <FormControlLabel
                  value="TRADE"
                  control={<Radio />}
                  label="Offer a trade"
                  disabled={!tradeAllowed}
                />
                <FormControlLabel
                  value="GIFT_REQUEST"
                  control={<Radio />}
                  label="Ask for as a gift"
                  disabled={!giftAllowed}
                />
              </RadioGroup>
            </FormControl>

            {offerType === 'TRADE' && (
              <TextField
                select
                label="Offer one of your listings"
                value={offeredListingId}
                onChange={(e) => setOfferedListingId(e.target.value)}
                helperText={
                  myListings.length === 0
                    ? "You don't have any active listings to offer."
                    : undefined
                }
                required
                fullWidth
              >
                <MenuItem value="" disabled>
                  Choose a listing
                </MenuItem>
                {myListings.map((l) => (
                  <MenuItem key={l.id} value={l.id}>
                    {l.title}
                  </MenuItem>
                ))}
              </TextField>
            )}

            <TextField
              label="Message (optional)"
              multiline
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              inputProps={{ maxLength: 1000 }}
              helperText={`${message.length}/1000`}
              fullWidth
            />

            <Button type="submit" variant="contained" size="large" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send offer'}
            </Button>
          </Stack>
        </form>
      </Box>
    </Container>
  );
}
