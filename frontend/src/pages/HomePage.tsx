import { Box, Button, Container, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Swap with your neighbors.
        </Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>
          Trade and gift goods and services with your neighbors. No money involved.
        </Typography>

        {user ? (
          <>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Welcome back, <strong>@{user.handle}</strong>
            </Typography>
            <Button component={RouterLink} to="/listings" variant="contained" size="large">
              Browse listings
            </Button>
          </>
        ) : (
          <Button component={RouterLink} to="/listings" variant="contained" size="large">
            Browse listings
          </Button>
        )}
      </Box>
    </Container>
  );
}
