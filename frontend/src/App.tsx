import { Container, Typography, Box } from '@mui/material';

export default function App() {
  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Sequim Barter
        </Typography>
        <Typography variant="body1">
          Trade and gift goods and services with your neighbors. No money involved.
        </Typography>
      </Box>
    </Container>
  );
}
