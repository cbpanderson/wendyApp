import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Link,
  Stack,
  Typography,
} from '@mui/material';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/client';
import { deleteListing, getListing, Listing, OfferType } from '../api/listings';

function formatOfferType(t: OfferType): string {
  if (t === 'TRADE_ONLY') return 'Open to trade';
  if (t === 'GIFT_ONLY') return 'Gift only';
  return 'Either';
}

export default function ListingDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setListing(null);
    getListing(id)
      .then((l) => {
        if (!cancelled) setListing(l);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          setError('Could not load listing.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (notFound || !listing) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 6 }}>
          <Alert severity="warning">Listing not found.</Alert>
        </Box>
      </Container>
    );
  }

  const isOwner = isAuthenticated && user?.handle === listing.owner.handle;

  const onDeleteConfirmed = async () => {
    try {
      await deleteListing(listing.id);
      navigate('/me/listings', { replace: true });
    } catch {
      setError('Could not delete listing.');
      setConfirmDelete(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Typography variant="h4" component="h1" gutterBottom>
          {listing.title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {listing.category.name} · {formatOfferType(listing.offerType)}
        </Typography>

        {listing.photos.length > 0 && (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2, mb: 2 }}>
            {listing.photos.slice(0, 2).map((p) => (
              <Box
                key={p.id}
                component="img"
                src={p.url}
                alt={`Photo ${p.position + 1} of ${listing.title}`}
                sx={{
                  width: { xs: '100%', sm: '50%' },
                  maxHeight: 360,
                  objectFit: 'cover',
                  borderRadius: 1,
                  border: 1,
                  borderColor: 'divider',
                }}
              />
            ))}
          </Stack>
        )}

        <Typography variant="body1" sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>
          {listing.description}
        </Typography>

        <Box sx={{ mt: 4, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Offered by
          </Typography>
          <Link component={RouterLink} to={`/users/${listing.owner.handle}`} underline="hover">
            <Typography variant="h6" component="span">
              @{listing.owner.handle}
            </Typography>
          </Link>
          <Typography variant="body2" color="text.secondary">
            {listing.owner.averageStars != null
              ? `${listing.owner.averageStars.toFixed(1)} stars (${listing.owner.ratingCount})`
              : 'No ratings yet'}
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
          {!isAuthenticated && (
            <Button component={RouterLink} to="/login" variant="contained">
              Log in to make an offer
            </Button>
          )}
          {isAuthenticated && !isOwner && (
            <Button
              component={RouterLink}
              to={`/listings/${listing.id}/offer`}
              variant="contained"
              size="large"
            >
              Make an Offer
            </Button>
          )}
          {isOwner && (
            <>
              <Button
                component={RouterLink}
                to={`/listings/${listing.id}/edit`}
                variant="contained"
              >
                Edit listing
              </Button>
              <Button color="error" variant="outlined" onClick={() => setConfirmDelete(true)}>
                Delete listing
              </Button>
            </>
          )}
        </Stack>

        <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
          <DialogTitle>Delete this listing?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              This will remove the listing from browse. Past offers and deals keep the original details.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button color="error" onClick={onDeleteConfirmed}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
}
