import { Box } from '@mui/material';
import { ReactNode } from 'react';
import NavBar from './NavBar';
import BottomNav from './BottomNav';
import { ToastProvider } from './ToastProvider';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <ToastProvider>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <NavBar />
        <Box component="main" sx={{ flexGrow: 1, pb: { xs: 8, md: 0 } }}>
          {children}
        </Box>
        <BottomNav />
      </Box>
    </ToastProvider>
  );
}
