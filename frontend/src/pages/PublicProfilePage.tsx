import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { ApiError } from '../api/client';
import { getPublicProfile, type PublicProfileResponse } from '../api/auth';
import { getRatingsForUser, type RatingPage } from '../api/ratings';
import { type OfferType } from '../api/listings';

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
 * Public profile by handle. Per spec-docs/02-domain.md the email is never exposed
 * here — the API doesn't return it, and we never render it.
 */
export default function PublicProfilePage() {
  const { handle = '' } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setProfile(null);
    getPublicProfile(handle)
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [handle]);

  const { data: ratingsData } = useQuery<RatingPage>({
    queryKey: ['userRatings', handle],
    queryFn: () => getRatingsForUser(handle),
    enabled: !!handle && !notFound,
  });

  if (loading) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (notFound || !profile) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ py: 6 }}>
          <Alert severity="warning">No user with handle @{handle}.</Alert>
        </Box>
      </Container>
    );
  }

  const displayHandle = profile.handle ?? '';
  const activeListings = profile.activeListings ?? [];

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
            {displayHandle[0]?.toUpperCase() ?? '?'}
          </Avatar>
          <Box sx={{ pb: 1 }}>
            <Typography variant="h5">@{displayHandle}</Typography>
            <Typography variant="body2" color="text.secondary">
              Sequim, WA {profile.zipCode}
            </Typography>
          </Box>
        </Box>

        {/* Rating */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {profile.averageStars != null
            ? `Average rating: ${profile.averageStars.toFixed(1)} (${profile.ratingCount})`
            : 'No ratings yet'}
        </Typography>

        {/* Bio */}
        <Typography variant="body1" data-testid="public-profile-bio" sx={{ mb: 2 }}>
          {profile.bio?.trim() ? profile.bio : <em>No bio.</em>}
        </Typography>

        {/* Ratings section */}
        {ratingsData && ratingsData.total > 0 && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Ratings
            </Typography>
            {ratingsData.averageStars != null && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                ⭐ {ratingsData.averageStars.toFixed(1)} / 5 ({ratingsData.total}{' '}
                {ratingsData.total === 1 ? 'rating' : 'ratings'})
              </Typography>
            )}
            {ratingsData.items.map((r) => (
              <Box key={r.id} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="body2" fontWeight="bold">
                  @{r.rater.handle} — {'⭐'.repeat(r.stars)}
                </Typography>
                {r.review && (
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {r.review}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                  {new Date(r.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Active listings */}
        {activeListings.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="overline" display="block" sx={{ mb: 1 }}>
              Active listings
            </Typography>
            {activeListings.map((listing) => (
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
            ))}
          </>
        )}
      </Container>
    </>
  );
}
