import { Box, Button, Chip, Container, Stack, Typography } from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import { getDeal, markComplete, cancelDeal } from '../api/deals';
import type { Deal } from '../api/deals';
import type { DealStatus } from '../api/offers';
import { useToast } from '../components/ToastProvider';
import { dealStatusLabel } from '../utils/statusLabels';

function statusColor(
  status: DealStatus
): 'warning' | 'info' | 'success' | 'default' {
  if (status === 'ACCEPTED') return 'warning';
  if (status === 'COMPLETED_BY_A' || status === 'COMPLETED_BY_B') return 'info';
  if (status === 'COMPLETED') return 'success';
  return 'default';
}

export default function DealPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: deal, isLoading, error } = useQuery<Deal>({
    queryKey: ['deal', id],
    queryFn: () => getDeal(id!),
    enabled: !!id,
  });

  const markCompleteMutation = useMutation({
    mutationFn: () => markComplete(id!),
    onSuccess: (updated) => {
      queryClient.setQueryData(['deal', id], updated);
      showToast('Marked as complete', 'success');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelDeal(id!),
    onSuccess: (updated) => {
      queryClient.setQueryData(['deal', id], updated);
      showToast('Deal cancelled', 'info');
    },
  });

  if (isLoading) return <Container><Typography sx={{ py: 4 }}>Loading…</Typography></Container>;
  if (error || !deal) return <Container><Typography sx={{ py: 4 }}>Deal not found.</Typography></Container>;

  const callerHandle = user?.handle;
  const isParticipantA = callerHandle === deal.participantA.handle;
  const isParticipantB = callerHandle === deal.participantB.handle;
  const isParticipant = isParticipantA || isParticipantB;

  const status = deal.status;

  const canMarkComplete =
    isParticipant &&
    status !== 'COMPLETED' &&
    status !== 'CANCELLED' &&
    !(isParticipantA && status === 'COMPLETED_BY_A') &&
    !(isParticipantB && status === 'COMPLETED_BY_B');

  const canCancel =
    isParticipant &&
    status !== 'COMPLETED' &&
    status !== 'CANCELLED';

  const dealTitle =
    deal.dealType === 'TRADE'
      ? `${deal.listingA.title} ↔ ${deal.listingB?.title ?? '—'}`
      : deal.listingA.title;

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Deal
        </Typography>

        <Stack spacing={2}>
          <Box>
            <Typography variant="h6">{dealTitle}</Typography>
            <Typography variant="body2" color="text.secondary">
              Type: {deal.dealType === 'TRADE' ? 'Trade' : 'Gift'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Between{' '}
              <RouterLink to={`/users/${deal.participantA.handle}`}>
                @{deal.participantA.handle}
              </RouterLink>
              {' and '}
              <RouterLink to={`/users/${deal.participantB.handle}`}>
                @{deal.participantB.handle}
              </RouterLink>
            </Typography>
          </Box>

          <Box>
            <Chip label={dealStatusLabel(status, isParticipantA)} color={statusColor(status)} />
          </Box>

          {markCompleteMutation.isError && (
            <Typography color="error">Could not mark complete.</Typography>
          )}
          {cancelMutation.isError && (
            <Typography color="error">Could not cancel deal.</Typography>
          )}

          <Stack direction="row" spacing={2}>
            {canMarkComplete && (
              <Button
                variant="contained"
                onClick={() => markCompleteMutation.mutate()}
                disabled={markCompleteMutation.isPending}
              >
                Mark as complete
              </Button>
            )}
            {canCancel && (
              <Button
                variant="outlined"
                color="warning"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
              >
                Cancel
              </Button>
            )}
            {status === 'COMPLETED' && (
              <Button variant="outlined" component={RouterLink} to={`/deals/${id}/rate`}>
                Leave a rating
              </Button>
            )}
          </Stack>
        </Stack>
      </Box>
    </Container>
  );
}
