import { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import { getOffer } from '../api/offers';
import { getMessages, postMessage } from '../api/messages';
import { ApiError } from '../api/client';

function statusColor(
  status: string
): 'default' | 'success' | 'warning' | 'error' {
  if (status === 'ACCEPTED') return 'success';
  if (status === 'PENDING') return 'warning';
  if (status === 'DECLINED' || status === 'WITHDRAWN') return 'default';
  return 'default';
}

export default function OfferThreadPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);

  const {
    data: offer,
    isLoading: offerLoading,
    error: offerError,
  } = useQuery({
    queryKey: ['offer', id],
    queryFn: () => getOffer(id!),
    enabled: isAuthenticated && !!id,
  });

  const {
    data: threadData,
    isLoading: messagesLoading,
  } = useQuery({
    queryKey: ['messages', id],
    queryFn: () => getMessages(id!),
    enabled: isAuthenticated && !!id,
    refetchInterval: 30_000,
  });

  const sendMutation = useMutation({
    mutationFn: (body: string) => postMessage(id!, body),
    onSuccess: () => {
      setMessageText('');
      setSendError(null);
      queryClient.invalidateQueries({ queryKey: ['messages', id] });
    },
    onError: (err) => {
      if (err instanceof ApiError) setSendError(err.message);
      else setSendError('Could not send message.');
    },
  });

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (offerLoading || messagesLoading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 6 }}>
          <Typography>Loading…</Typography>
        </Box>
      </Container>
    );
  }

  if (offerError) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 6 }}>
          <Alert severity="error">Could not load offer.</Alert>
        </Box>
      </Container>
    );
  }

  if (!offer) return null;

  const isClosed =
    offer.status === 'WITHDRAWN' || offer.status === 'DECLINED';

  const otherParty =
    user?.handle === offer.fromUser.handle ? offer.toUser : offer.fromUser;

  const messages = threadData?.items ?? [];

  const handleSend = () => {
    if (!messageText.trim()) return;
    sendMutation.mutate(messageText);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        {/* Offer summary */}
        <Typography variant="h4" component="h1" gutterBottom>
          {offer.listing.title}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <Chip
            label={offer.status}
            color={statusColor(offer.status)}
            size="small"
          />
          <Typography variant="body2" color="text.secondary">
            {offer.offerType === 'TRADE' ? 'Trade offer' : 'Gift request'}
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Other party: @{otherParty.handle}
        </Typography>

        <Divider sx={{ mb: 3 }} />

        {/* Message thread */}
        <Typography variant="h6" gutterBottom>
          Messages
        </Typography>

        {messages.length === 0 ? (
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            No messages yet.
          </Typography>
        ) : (
          <Stack spacing={2} sx={{ mb: 3 }}>
            {messages.map((msg) => (
              <Box
                key={msg.id}
                sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}
              >
                <Stack direction="row" spacing={1} alignItems="baseline">
                  <Typography variant="subtitle2">@{msg.sender.handle}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(msg.createdAt).toLocaleString()}
                  </Typography>
                </Stack>
                <Typography variant="body1">{msg.body}</Typography>
              </Box>
            ))}
          </Stack>
        )}

        {/* Send input */}
        {sendError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {sendError}
          </Alert>
        )}
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="Write a message"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            disabled={isClosed || sendMutation.isPending}
          />
          <Button
            variant="contained"
            onClick={handleSend}
            disabled={isClosed || !messageText.trim() || sendMutation.isPending}
          >
            Send
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}
