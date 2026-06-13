import { useEffect, useState } from 'react';
import { Link as RouterLink, Navigate, useNavigate } from 'react-router-dom';
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
import EmptyState from '../components/EmptyState';

const HouseIllustration = (
  <svg viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg" width="100" height="80">
    <rect x="20" y="38" width="60" height="36" rx="3" fill="#F5EDF5" stroke="#D4B8CC" strokeWidth="1.5"/>
    <polygon points="50,12 15,40 85,40" fill="#8B4A6B" opacity="0.85"/>
    <rect x="40" y="50" width="20" height="24" rx="2" fill="#D4B8CC"/>
    <rect x="24" y="46" width="14" height="12" rx="2" fill="white" stroke="#D4B8CC" strokeWidth="1"/>
    <circle cx="78" cy="26" r="10" fill="#FDF3DC" stroke="#C4922A" strokeWidth="1.5"/>
    <line x1="78" y1="21" x2="78" y2="31" stroke="#C4922A" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="73" y1="26" x2="83" y2="26" stroke="#C4922A" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export default function MyListingsPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
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
          <EmptyState
            illustration={HouseIllustration}
            title="Nothing to swap yet"
            subtitle="Share something you have — a skill, a harvest, a spare. Your neighbors are ready."
            ctaLabel="Post your first listing"
            onCta={() => navigate('/listings/new')}
          />
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
