import { useEffect, useState } from 'react';
import { Link as RouterLink, Navigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import { useAuth } from '../auth/AuthContext';
import { deleteListing, getMyListings, Listing } from '../api/listings';

export default function MyListingsPage() {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getMyListings()
      .then((p) => setItems(p.items))
      .catch(() => setError('Could not load your listings.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const onDeleteConfirmed = async () => {
    if (!confirmId) return;
    try {
      await deleteListing(confirmId);
      setItems((prev) => prev.filter((l) => l.id !== confirmId));
    } catch {
      setError('Could not delete listing.');
    } finally {
      setConfirmId(null);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1">
            My listings
          </Typography>
          <Button component={RouterLink} to="/listings/new" variant="contained">
            New listing
          </Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Typography>Loading…</Typography>
        ) : items.length === 0 ? (
          <Typography color="text.secondary">You don't have any listings yet.</Typography>
        ) : (
          <Stack spacing={2}>
            {items.map((l) => (
              <Box key={l.id} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h6">{l.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {l.category.name} · {l.status} · {l.offerType.replace('_', ' ').toLowerCase()}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Button component={RouterLink} to={`/listings/${l.id}/edit`}>
                      Edit
                    </Button>
                    <Button color="error" onClick={() => setConfirmId(l.id)}>
                      Delete
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            ))}
          </Stack>
        )}

        <Dialog open={confirmId !== null} onClose={() => setConfirmId(null)}>
          <DialogTitle>Delete this listing?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              This will remove the listing from browse. Past offers and deals keep the original details.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmId(null)}>Cancel</Button>
            <Button color="error" onClick={onDeleteConfirmed}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
}
