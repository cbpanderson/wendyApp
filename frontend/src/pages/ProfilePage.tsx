import { useEffect, useState } from 'react';
import { Link as RouterLink, Navigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Container,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/client';
import { getMe, updateMe } from '../api/auth';

/**
 * Authenticated profile page. Shows the current user's handle, ZIP, average rating,
 * and bio, and lets them edit the bio.
 */
export default function ProfilePage() {
  const { user, isAuthenticated, setUser } = useAuth();
  const [bioDraft, setBioDraft] = useState(user?.bio ?? '');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 6 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          @{user.handle}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Sequim, WA {user.zipCode}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {user.averageStars != null
            ? `Average rating: ${user.averageStars.toFixed(1)} (${user.ratingCount})`
            : 'No ratings yet'}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {editing ? (
          <Stack spacing={2}>
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
          <Stack spacing={2}>
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
      </Box>
    </Container>
  );
}
