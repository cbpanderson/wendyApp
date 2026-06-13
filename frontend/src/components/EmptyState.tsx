import { Box, Button, Typography } from '@mui/material';

interface EmptyStateProps {
  illustration: React.ReactNode;
  title: string;
  subtitle: string;
  ctaLabel: string;
  onCta: () => void;
}

export default function EmptyState({
  illustration,
  title,
  subtitle,
  ctaLabel,
  onCta,
}: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        py: 8,
        px: 3,
      }}
    >
      {illustration}
      <Typography
        variant="h6"
        sx={{ mt: 2, mb: 1, fontFamily: 'Cormorant Garamond', fontWeight: 600 }}
      >
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 280, mb: 3 }}>
        {subtitle}
      </Typography>
      <Button variant="contained" color="primary" onClick={onCta}>
        {ctaLabel}
      </Button>
    </Box>
  );
}
