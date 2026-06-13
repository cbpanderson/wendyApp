import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  browseListings,
  Category,
  getCategories,
  Listing,
  OfferType,
} from '../api/listings';
import ListingCard from '../components/ListingCard';
import EmptyState from '../components/EmptyState';

const MagnifyingGlassIllustration = (
  <svg viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg" width="100" height="80">
    <circle cx="42" cy="36" r="22" fill="#F5EDF5" stroke="#D4B8CC" strokeWidth="1.5"/>
    <line x1="58" y1="52" x2="74" y2="68" stroke="#D4B8CC" strokeWidth="4" strokeLinecap="round"/>
    <line x1="34" y1="32" x2="50" y2="32" stroke="#8B4A6B" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    <line x1="34" y1="38" x2="46" y2="38" stroke="#8B4A6B" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
  </svg>
);

const PAGE_SIZE = 20;

export default function BrowseListingsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // filters
  const [categoryId, setCategoryId] = useState<string>('');
  const [offerType, setOfferType] = useState<'' | OfferType>('');
  const [queryInput, setQueryInput] = useState('');
  const [q, setQ] = useState('');

  // Debounce search input.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setQ(queryInput), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [queryInput]);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const filters = useMemo(
    () => ({
      categoryId: categoryId || undefined,
      offerType: offerType || undefined,
      q: q || undefined,
    }),
    [categoryId, offerType, q]
  );

  // Reset paging whenever filters change.
  useEffect(() => {
    setOffset(0);
  }, [filters]);

  // Fetch when filters or paging change.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    browseListings({ ...filters, limit: PAGE_SIZE, offset })
      .then((page) => {
        if (cancelled) return;
        setTotal(page.total);
        if (offset === 0) {
          setItems(page.items);
        } else {
          setItems((prev) => [...prev, ...page.items]);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Could not load listings.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters, offset]);

  const hasMore = items.length < total;

  const clearFilters = () => {
    setQueryInput('');
    setQ('');
    setCategoryId('');
    setOfferType('');
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Browse listings
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Sequim, WA only.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <TextField
            label="Search"
            placeholder="Title or description"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            fullWidth
            inputProps={{ 'aria-label': 'Search' }}
          />
          <TextField
            select
            label="Category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">All categories</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Offer type"
            value={offerType}
            onChange={(e) => setOfferType(e.target.value as '' | OfferType)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="TRADE_ONLY">Trade only</MenuItem>
            <MenuItem value="GIFT_ONLY">Gift only</MenuItem>
            <MenuItem value="EITHER">Either</MenuItem>
          </TextField>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading && items.length === 0 ? (
          <Typography>Loading…</Typography>
        ) : items.length === 0 ? (
          <EmptyState
            illustration={MagnifyingGlassIllustration}
            title="Nothing here yet"
            subtitle="No listings match your filters yet — try a different search or category, or be the first to post one."
            ctaLabel="Clear filters"
            onCta={clearFilters}
          />
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
              gap: 2,
            }}
          >
            {items.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </Box>
        )}

        {hasMore && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="outlined"
              onClick={() => setOffset((o) => o + PAGE_SIZE)}
              disabled={loading}
            >
              {loading ? 'Loading…' : 'Load more'}
            </Button>
          </Box>
        )}
      </Box>
    </Container>
  );
}
