import { Navigate, useNavigate } from 'react-router-dom';
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
import EmptyState from '../components/EmptyState';
import { dealStatusLabel } from '../utils/statusLabels';

const SwapCirclesIllustration = (
  <svg viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg" width="100" height="80">
    <circle cx="32" cy="40" r="22" fill="#F5EDF5" stroke="#D4B8CC" strokeWidth="1.5"/>
    <circle cx="68" cy="40" r="22" fill="#E8F4EA" stroke="#A8CFA8" strokeWidth="1.5"/>
    <rect x="24" y="33" width="16" height="14" rx="3" fill="#8B4A6B" opacity="0.7"/>
    <rect x="60" y="33" width="16" height="14" rx="3" fill="#6B8F71" opacity="0.7"/>
    <path d="M46 36 L54 40 L46 44" stroke="#C4922A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M54 44 L46 40 L54 36" stroke="#C4922A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

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
  const navigate = useNavigate();

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
          <EmptyState
            illustration={SwapCirclesIllustration}
            title="No deals in progress"
            subtitle="When you and a neighbor agree to swap, your deal shows up here."
            ctaLabel="Browse listings"
            onCta={() => navigate('/listings')}
          />
        ) : (
          <Stack spacing={2}>
            {data.items.map((deal) => {
              const isParticipantA = user?.handle === deal.participantA.handle;
              const otherParty = isParticipantA
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
                    <Chip label={dealStatusLabel(deal.status, isParticipantA)} color={statusColor(deal.status)} size="small" />
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
