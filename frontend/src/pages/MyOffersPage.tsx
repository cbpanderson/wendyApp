import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Link,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/client';
import {
  acceptOffer,
  declineOffer,
  getMyOffers,
  Offer,
  OfferDirection,
  OfferStatus,
  withdrawOffer,
} from '../api/offers';

function statusColor(
  status: OfferStatus
): 'default' | 'success' | 'warning' | 'error' {
  if (status === 'ACCEPTED') return 'success';
  if (status === 'PENDING') return 'warning';
  if (status === 'DECLINED' || status === 'WITHDRAWN') return 'default';
  return 'default';
}

export default function MyOffersPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const directionParam = searchParams.get('direction');
  const direction: OfferDirection =
    directionParam === 'received' ? 'received' : 'sent';

  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getMyOffers(direction)
      .then((p) => setOffers(p.items))
      .catch(() => setError('Could not load offers.'))
      .finally(() => setLoading(false));
  }, [direction]);

  useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated, load]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const onAccept = async (offer: Offer) => {
    setActionError(null);
    try {
      const deal = await acceptOffer(offer.id);
      setSuccessMessage('Offer accepted. The deal is open.');
      // Navigate to deal detail (US-8 will implement this page).
      navigate(`/deals/${deal.id}`);
    } catch (err) {
      if (err instanceof ApiError) setActionError(err.message);
      else setActionError('Could not accept the offer.');
    }
  };

  const onDecline = async (offer: Offer) => {
    setActionError(null);
    try {
      await declineOffer(offer.id);
      setOffers((prev) =>
        prev.map((o) => (o.id === offer.id ? { ...o, status: 'DECLINED' } : o))
      );
    } catch (err) {
      if (err instanceof ApiError) setActionError(err.message);
      else setActionError('Could not decline the offer.');
    }
  };

  const onWithdraw = async (offer: Offer) => {
    setActionError(null);
    try {
      await withdrawOffer(offer.id);
      setOffers((prev) =>
        prev.map((o) => (o.id === offer.id ? { ...o, status: 'WITHDRAWN' } : o))
      );
    } catch (err) {
      if (err instanceof ApiError) setActionError(err.message);
      else setActionError('Could not withdraw the offer.');
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My offers
        </Typography>

        <Tabs
          value={direction}
          onChange={(_, value) => {
            setSearchParams({ direction: value });
            setSuccessMessage(null);
            setActionError(null);
          }}
          sx={{ mb: 3 }}
        >
          <Tab label="Sent" value="sent" />
          <Tab label="Received" value="received" />
        </Tabs>

        {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
        {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Typography>Loading…</Typography>
        ) : offers.length === 0 ? (
          <Typography color="text.secondary">
            {direction === 'sent'
              ? "You haven't made any offers yet."
              : "You haven't received any offers yet."}
          </Typography>
        ) : (
          <Stack spacing={2}>
            {offers.map((o) => {
              const counterparty = direction === 'sent' ? o.toUser : o.fromUser;
              return (
                <Box
                  key={o.id}
                  sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}
                >
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    spacing={2}
                  >
                    <Box sx={{ flexGrow: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={o.status}
                          color={statusColor(o.status)}
                          size="small"
                        />
                        <Typography variant="caption" color="text.secondary">
                          {o.offerType === 'TRADE' ? 'Trade' : 'Gift request'}
                        </Typography>
                      </Stack>
                      <Link
                        component={RouterLink}
                        to={`/listings/${o.listing.id}`}
                        underline="hover"
                      >
                        <Typography variant="h6" component="span">
                          {o.listing.title}
                        </Typography>
                      </Link>
                      <Typography variant="body2" color="text.secondary">
                        {direction === 'sent' ? 'To ' : 'From '}
                        <Link
                          component={RouterLink}
                          to={`/users/${counterparty.handle}`}
                          underline="hover"
                        >
                          @{counterparty.handle}
                        </Link>
                        {' · '}
                        {new Date(o.createdAt).toLocaleDateString()}
                      </Typography>
                      {o.offeredListing && (
                        <Typography variant="body2" color="text.secondary">
                          Offered: {o.offeredListing.title}
                        </Typography>
                      )}
                    </Box>
                    <Stack direction="row" spacing={1}>
                      {direction === 'received' && o.status === 'PENDING' && (
                        <>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => onAccept(o)}
                          >
                            Accept
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => onDecline(o)}
                          >
                            Decline
                          </Button>
                        </>
                      )}
                      {direction === 'sent' && o.status === 'PENDING' && (
                        <Button
                          variant="outlined"
                          size="small"
                          color="warning"
                          onClick={() => onWithdraw(o)}
                        >
                          Withdraw
                        </Button>
                      )}
                    </Stack>
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
