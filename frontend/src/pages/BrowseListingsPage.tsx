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
          <Typography color="text.secondary">
            No listings match your filters yet.
          </Typography>
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
