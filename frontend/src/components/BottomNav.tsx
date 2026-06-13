import { Paper, BottomNavigation, BottomNavigationAction, Badge } from '@mui/material';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useActionCount } from '../hooks/useActionCount';

const tabs = ['/listings', '/listings/new', '/me/offers', '/me'];

function activeTab(pathname: string): number {
  // Find the most specific match
  const idx = tabs.findIndex((t) => pathname === t || pathname.startsWith(t + '/'));
  return idx === -1 ? 0 : idx;
}

export default function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const current = activeTab(location.pathname);
  const { count: actionCount } = useActionCount();

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: { xs: 'block', md: 'none' },
        borderTop: '1px solid #E8DDD4',
        zIndex: (theme) => theme.zIndex.appBar,
      }}
      elevation={0}
    >
      <BottomNavigation
        value={current}
        sx={{ bgcolor: '#FFFFFF' }}
      >
        <BottomNavigationAction
          label="Browse"
          icon={<StorefrontOutlinedIcon />}
          onClick={() => navigate('/listings')}
          sx={{ '&.Mui-selected': { color: '#8B4A6B' } }}
        />
        <BottomNavigationAction
          label="Create"
          icon={<AddCircleOutlineIcon />}
          disabled={!user}
          onClick={() => user && navigate('/listings/new')}
          sx={{ '&.Mui-selected': { color: '#8B4A6B' } }}
        />
        <BottomNavigationAction
          label="Activity"
          icon={
            <Badge badgeContent={user && actionCount > 0 ? actionCount : 0} color="error" max={9} invisible={!user || actionCount === 0}>
              <NotificationsNoneOutlinedIcon />
            </Badge>
          }
          disabled={!user}
          onClick={() => user && navigate('/me/offers')}
          sx={{ '&.Mui-selected': { color: '#8B4A6B' } }}
        />
        <BottomNavigationAction
          label="Profile"
          icon={<PersonOutlineIcon />}
          onClick={() => navigate(user ? '/me' : '/login')}
          sx={{ '&.Mui-selected': { color: '#8B4A6B' } }}
        />
      </BottomNavigation>
    </Paper>
  );
}
