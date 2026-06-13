import { useEffect, useState } from 'react';
import { Link as RouterLink, Navigate, useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/client';
import { getMe, updateMe } from '../api/auth';
import { getMyListings, type Listing, type OfferType } from '../api/listings';

function offerTypeLabel(t: OfferType): string {
  if (t === 'TRADE_ONLY') return 'Trade';
  if (t === 'GIFT_ONLY') return 'Gift';
  return 'Trade or gift';
}

function offerTypeChipSx(t: OfferType) {
  if (t === 'TRADE_ONLY') return { backgroundColor: '#FDF3DC', color: '#9A6B10' };
  if (t === 'GIFT_ONLY') return { backgroundColor: '#E8F4EA', color: '#2E7D32' };
  return { backgroundColor: '#EDE7F6', color: '#4527A0' };
}

/**
 * Authenticated profile page. Shows the current user's handle, ZIP, average rating,
 * and bio, and lets them edit the bio.
 */
export default function ProfilePage() {
  const { user, isAuthenticated, setUser } = useAuth();
  const navigate = useNavigate();
  const [bioDraft, setBioDraft] = useState(user?.bio ?? '');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);

  // Refresh from the server on mount so changes from elsewhere are reflected.
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    getMe()
      .then((u) => {
        if (cancelled) return;
        setUser(u);
        setBioDraft(u.bio ?? '');
      })
      .catch(() => {
        // Surface auth issues via the unauth redirect path; ignore other errors here.
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load the user's active listings.
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    getMyListings()
      .then((page) => {
        if (!cancelled) setListings(page.items.filter((l) => l.status === 'ACTIVE'));
      })
      .catch(() => {
        // Non-critical — silently ignore
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const onSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateMe({ bio: bioDraft });
      setUser(updated);
      setEditing(false);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Could not save bio.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handle = user.handle ?? '';

  return (
    <>
      {/* Cover banner */}
      <Box sx={{ backgroundColor: 'primary.main', height: 120, width: '100%' }} />

      <Container maxWidth="md" sx={{ mt: 0 }}>
        {/* Avatar + handle row */}
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, mt: '-36px', mb: 2 }}>
          <Avatar
            sx={{
              width: 72,
              height: 72,
              bgcolor: 'primary.main',
              color: '#fff',
              fontSize: '32px',
              fontWeight: 600,
              fontFamily: 'Cormorant Garamond',
              border: '3px solid',
              borderColor: 'background.default',
            }}
          >
            {handle[0]?.toUpperCase() ?? '?'}
          </Avatar>
          <Box sx={{ pb: 1 }}>
            <Typography variant="h5">@{handle}</Typography>
            <Typography variant="body2" color="text.secondary">
              Sequim, WA {user.zipCode}
            </Typography>
          </Box>
        </Box>

        {/* Rating */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {user.averageStars != null
            ? `Average rating: ${user.averageStars.toFixed(1)} (${user.ratingCount})`
            : 'No ratings yet'}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Bio section */}
        {editing ? (
          <Stack spacing={2} sx={{ mb: 3 }}>
            <TextField
              label="Bio"
              multiline
              rows={4}
              value={bioDraft}
              onChange={(e) => setBioDraft(e.target.value)}
              inputProps={{ maxLength: 500 }}
              fullWidth
            />
            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={onSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
              <Button
                onClick={() => {
                  setBioDraft(user.bio ?? '');
                  setEditing(false);
                  setError(null);
                }}
                disabled={saving}
              >
                Cancel
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Stack spacing={2} sx={{ mb: 3 }}>
            <Typography variant="body1" data-testid="profile-bio">
              {user.bio?.trim() ? user.bio : <em>No bio yet.</em>}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={() => setEditing(true)}>
                Edit bio
              </Button>
              <Button component={RouterLink} to={`/users/${user.handle}`}>
                View public profile
              </Button>
            </Stack>
          </Stack>
        )}

        <Divider sx={{ mb: 2 }} />

        {/* Active listings */}
        <Typography variant="overline" display="block" sx={{ mb: 1 }}>
          Active listings
        </Typography>
        {listings.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No active listings yet.
          </Typography>
        ) : (
          listings.map((listing) => (
            <Paper
              key={listing.id}
              variant="outlined"
              sx={{
                p: 1.5,
                mb: 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderRadius: 2,
                cursor: 'pointer',
                '&:hover': { borderColor: 'primary.main' },
              }}
              onClick={() => navigate(`/listings/${listing.id}`)}
            >
              <Box>
                <Typography variant="body2" fontWeight={500}>
                  {listing.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {listing.category.name} · {offerTypeLabel(listing.offerType)}
                </Typography>
              </Box>
              <Chip
                label={offerTypeLabel(listing.offerType)}
                size="small"
                sx={offerTypeChipSx(listing.offerType)}
              />
            </Paper>
          ))
        )}
      </Container>
    </>
  );
}
