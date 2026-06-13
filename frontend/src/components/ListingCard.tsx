import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import { Listing, OfferType } from '../api/listings';

interface ListingCardProps {
  listing: Listing;
}

function offerTypeLabel(t: OfferType): string {
  if (t === 'TRADE_ONLY') return 'Trade';
  if (t === 'GIFT_ONLY') return 'Gift';
  return 'Either';
}

function offerTypeChipSx(t: OfferType) {
  if (t === 'TRADE_ONLY') return { bgcolor: '#FDF3DC', color: '#9A6B10', border: 'none' };
  if (t === 'GIFT_ONLY') return { bgcolor: '#E8F3EA', color: '#3A7040', border: 'none' };
  return { bgcolor: '#EEF2FF', color: '#4B5DA0', border: 'none' };
}

const PLACEHOLDER_GRADIENT =
  'linear-gradient(135deg, #F5EDF5 0%, #EDD9E8 50%, #F0E8D8 100%)';

const lineClamp = {
  overflow: 'hidden',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical' as const,
};

export default function ListingCard({ listing }: ListingCardProps) {
  const firstPhoto = listing.photos?.[0]?.url ?? null;
  const ownerInitial = listing.owner.handle?.[0]?.toUpperCase() ?? '?';
  const stars = listing.owner.averageStars;

  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        transition: 'border-color 0.2s, box-shadow 0.2s',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: '0 4px 16px rgba(139,74,107,0.12)',
        },
      }}
    >
      <CardActionArea component={RouterLink} to={`/listings/${listing.id}`}>
        {/* Top image area */}
        <Box
          sx={{
            height: 160,
            background: firstPhoto ? undefined : PLACEHOLDER_GRADIENT,
            overflow: 'hidden',
          }}
        >
          {firstPhoto && (
            <Box
              component="img"
              src={firstPhoto}
              alt={listing.title}
              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )}
        </Box>

        {/* Card body */}
        <CardContent sx={{ pt: 1.5 }}>
          {/* Chips row */}
          <Stack direction="row" spacing={0.5} sx={{ mb: 1, flexWrap: 'wrap' }}>
            <Chip
              label={listing.category.name}
              size="small"
              variant="outlined"
              color="primary"
            />
            <Chip
              label={offerTypeLabel(listing.offerType)}
              size="small"
              sx={offerTypeChipSx(listing.offerType)}
            />
          </Stack>

          {/* Title */}
          <Typography variant="subtitle1" fontWeight={500} sx={lineClamp}>
            {listing.title}
          </Typography>

          {/* Description */}
          {listing.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5, ...lineClamp }}
            >
              {listing.description}
            </Typography>
          )}

          {/* Owner row */}
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 1.5 }}>
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {ownerInitial}
            </Box>
            <Typography variant="caption" color="text.secondary">
              @{listing.owner.handle}
            </Typography>
            {stars !== null && stars !== undefined && (
              <Typography variant="caption" color="text.secondary">
                · ★ {stars.toFixed(1)}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
