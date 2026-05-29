import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Box, CircularProgress, Container, Divider, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { ApiError } from '../api/client';
import { getPublicProfile, type PublicProfileResponse } from '../api/auth';
import { getRatingsForUser, type RatingPage } from '../api/ratings';

/**
 * Public profile by handle. Per spec-docs/02-domain.md the email is never exposed
 * here — the API doesn't return it, and we never render it.
 */
export default function PublicProfilePage() {
  const { handle = '' } = useParams<{ handle: string }>();
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

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 6 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          @{profile.handle}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Sequim, WA {profile.zipCode}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {profile.averageStars != null
            ? `Average rating: ${profile.averageStars.toFixed(1)} (${profile.ratingCount})`
            : 'No ratings yet'}
        </Typography>
        <Typography variant="body1" data-testid="public-profile-bio">
          {profile.bio?.trim() ? profile.bio : <em>No bio.</em>}
        </Typography>

        {ratingsData && ratingsData.total > 0 && (
          <Box sx={{ mt: 4 }}>
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
      </Box>
    </Container>
  );
}
