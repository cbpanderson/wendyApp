import { Navigate } from 'react-router-dom';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Chip,
  Container,
  Link,
  Stack,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import { getMyDeals } from '../api/deals';
import type { DealPage } from '../api/deals';
import type { DealStatus } from '../api/offers';

function statusColor(
  status: DealStatus
): 'warning' | 'info' | 'success' | 'default' {
  if (status === 'ACCEPTED') return 'warning';
  if (status === 'COMPLETED_BY_A' || status === 'COMPLETED_BY_B') return 'info';
  if (status === 'COMPLETED') return 'success';
  return 'default';
}

export default function MyDealsPage() {
  const { isAuthenticated, user } = useAuth();

  const { data, isLoading } = useQuery<DealPage>({
    queryKey: ['myDeals'],
    queryFn: getMyDeals,
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My deals
        </Typography>

        {isLoading ? (
          <Typography>Loading…</Typography>
        ) : !data || data.items.length === 0 ? (
          <Typography color="text.secondary">You have no deals yet.</Typography>
        ) : (
          <Stack spacing={2}>
            {data.items.map((deal) => {
              const otherParty =
                user?.handle === deal.participantA.handle
                  ? deal.participantB
                  : deal.participantA;
              return (
                <Box
                  key={deal.id}
                  sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}
                >
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    spacing={2}
                  >
                    <Box>
                      <Link component={RouterLink} to={`/deals/${deal.id}`} underline="hover">
                        <Typography variant="h6" component="span">
                          {deal.listingA.title}
                        </Typography>
                      </Link>
                      <Typography variant="body2" color="text.secondary">
                        With{' '}
                        <Link
                          component={RouterLink}
                          to={`/users/${otherParty.handle}`}
                          underline="hover"
                        >
                          @{otherParty.handle}
                        </Link>
                      </Typography>
                    </Box>
                    <Chip label={deal.status} color={statusColor(deal.status)} size="small" />
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        )}
      </Box>
    </Container>
  );
}
