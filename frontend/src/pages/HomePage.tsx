import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function HomePage() {
  const { user, logout } = useAuth();

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Sequim Barter
        </Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>
          Trade and gift goods and services with your neighbors. No money involved.
        </Typography>

        {user ? (
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Typography>
              Signed in as <strong>@{user.handle}</strong>
            </Typography>
            <Button component={RouterLink} to="/listings" variant="contained">
              Browse listings
            </Button>
            <Button component={RouterLink} to="/listings/new" variant="outlined">
              Create a listing
            </Button>
            <Button component={RouterLink} to="/me/listings" variant="outlined">
              My listings
            </Button>
            <Button component={RouterLink} to="/me" variant="outlined">
              My profile
            </Button>
            <Button component={RouterLink} to={`/users/${user.handle}`} variant="text">
              Public view
            </Button>
            <Button variant="outlined" onClick={logout}>
              Sign out
            </Button>
          </Stack>
        ) : (
          <Stack direction="row" spacing={2}>
            <Button component={RouterLink} to="/listings" variant="contained" size="large">
              Browse listings
            </Button>
            <Button component={RouterLink} to="/signup" variant="outlined" size="large">
              Sign up
            </Button>
            <Button component={RouterLink} to="/login" variant="outlined" size="large">
              Log in
            </Button>
          </Stack>
        )}
      </Box>
    </Container>
  );
}
