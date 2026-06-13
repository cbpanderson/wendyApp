import { Box, Button, Chip, Container, Paper, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import { getMyOffers } from '../api/offers';
import { getMyListings } from '../api/listings';
import { getMyDeals } from '../api/deals';

// ─── Logged-out hero ──────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <Box sx={{ py: { xs: 8, md: 12 }, textAlign: 'center' }}>
      {/* H1 headline */}
      <Typography
        variant="h2"
        component="h1"
        sx={{ mb: 3, lineHeight: 1.15 }}
      >
        Trade what you{' '}
        <Box
          component="em"
          sx={{ color: 'primary.main', fontStyle: 'italic' }}
        >
          have.
        </Box>{' '}
        Get what you need.
      </Typography>

      {/* Tagline */}
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 5, fontSize: 18 }}
      >
        No money required.
      </Typography>

      {/* CTAs */}
      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 6 }}>
        <Button
          component={RouterLink}
          to="/listings"
          variant="contained"
          size="large"
        >
          Browse listings
        </Button>
        <Button
          component={RouterLink}
          to="/signup"
          variant="outlined"
          size="large"
        >
          Join the circle
        </Button>
      </Stack>

      {/* Trust stats */}
      <Stack direction="row" spacing={4} justifyContent="center" sx={{ mt: 5 }}>
        {[
          { value: '28', label: 'Categories' },
          { value: '100%', label: 'No money' },
          { value: 'Local', label: 'Neighbors only' },
        ].map((stat) => (
          <Box key={stat.label} sx={{ textAlign: 'center' }}>
            <Typography variant="h4" component="p">
              {stat.value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {stat.label}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  value,
  label,
  highlight,
}: {
  value: number | string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        textAlign: 'center',
        flex: 1,
      }}
    >
      <Typography
        variant="h4"
        sx={{ color: highlight ? 'warning.main' : 'primary.main' }}
      >
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Paper>
  );
}

// ─── Logged-in mini dashboard ─────────────────────────────────────────────────

function offerTypeLabel(type: string) {
  return type === 'TRADE' ? 'Trade offer' : 'Gift request';
}

function Dashboard({ handle }: { handle: string }) {
  const {
    data: receivedOffers,
    isLoading: offersLoading,
  } = useQuery({
    queryKey: ['myOffers', 'received'],
    queryFn: () => getMyOffers('received', { limit: 20 }),
  });

  const {
    data: deals,
    isLoading: dealsLoading,
  } = useQuery({
    queryKey: ['myDeals'],
    queryFn: getMyDeals,
  });

  const {
    data: listings,
    isLoading: listingsLoading,
  } = useQuery({
    queryKey: ['myListings'],
    queryFn: () => getMyListings(20, 0),
  });

  const isLoading = offersLoading || dealsLoading || listingsLoading;

  const pendingOffers = receivedOffers?.items.filter((o) => o.status === 'PENDING') ?? [];
  const pendingCount = pendingOffers.length;
  const dealCount = deals?.total ?? 0;
  const listingCount = listings?.total ?? 0;

  const latestPending = pendingOffers[0] ?? null;
  const mostRecentListing = listings?.items[0] ?? null;

  return (
    <Box sx={{ py: 6 }}>
      {/* Greeting */}
      <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
        Hey, {' '}
        <Box component="em" sx={{ color: 'primary.main', fontStyle: 'italic' }}>
          @{handle}
        </Box>{' '}
        👋
      </Typography>

      {/* Stat cards */}
      <Stack direction="row" spacing={2} sx={{ mb: 5 }}>
        {isLoading ? (
          <>
            <StatCard value="…" label="Pending offers" />
            <StatCard value="…" label="Active deals" />
            <StatCard value="…" label="My listings" />
          </>
        ) : (
          <>
            <StatCard
              value={pendingCount}
              label="Pending offers"
              highlight={pendingCount > 0}
            />
            <StatCard value={dealCount} label="Active deals" />
            <StatCard value={listingCount} label="My listings" />
          </>
        )}
      </Stack>

      {/* Latest offer received */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="overline" color="text.secondary" display="block" sx={{ mb: 1 }}>
          Latest offer received
        </Typography>

        {offersLoading ? (
          <Typography variant="body2" color="text.secondary">
            Loading…
          </Typography>
        ) : latestPending ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {latestPending.listing.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {offerTypeLabel(latestPending.offerType)} from @{latestPending.fromUser.handle}
            </Typography>
            <Chip label="PENDING" color="warning" size="small" />
          </Box>
        ) : (
          <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
            No pending offers
          </Typography>
        )}
      </Box>

      {/* Most recent listing */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="overline" color="text.secondary" display="block" sx={{ mb: 1 }}>
          Your most recent listing
        </Typography>

        {listingsLoading ? (
          <Typography variant="body2" color="text.secondary">
            Loading…
          </Typography>
        ) : mostRecentListing ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {mostRecentListing.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {mostRecentListing.category.name}
            </Typography>
            <Chip
              label={mostRecentListing.offerType.replace('_', ' ')}
              size="small"
            />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
              No listings yet
            </Typography>
            <Button
              component={RouterLink}
              to="/listings/new"
              variant="outlined"
              size="small"
            >
              Create your first listing
            </Button>
          </Box>
        )}
      </Box>

      {/* Browse CTA */}
      <Button
        component={RouterLink}
        to="/listings"
        variant="contained"
        size="large"
        fullWidth
      >
        Browse listings
      </Button>
    </Box>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { user } = useAuth();

  return (
    <Container maxWidth="md">
      {user ? <Dashboard handle={user.handle} /> : <HeroSection />}
    </Container>
  );
}
