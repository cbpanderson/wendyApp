import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Button,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Badge,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useActionCount } from '../hooks/useActionCount';

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { count: actionCount } = useActionCount();
  const [activityAnchor, setActivityAnchor] = useState<null | HTMLElement>(null);
  const [avatarAnchor, setAvatarAnchor] = useState<null | HTMLElement>(null);

  const handleActivityOpen = (e: React.MouseEvent<HTMLElement>) => setActivityAnchor(e.currentTarget);
  const handleActivityClose = () => setActivityAnchor(null);
  const handleAvatarOpen = (e: React.MouseEvent<HTMLElement>) => setAvatarAnchor(e.currentTarget);
  const handleAvatarClose = () => setAvatarAnchor(null);

  const handleSignOut = () => {
    handleAvatarClose();
    logout();
    navigate('/');
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: '#FFFFFF',
        boxShadow: '0 1px 0 0 #E8DDD4',
      }}
    >
      <Toolbar>
        {/* Wordmark */}
        <Typography
          component={RouterLink}
          to="/"
          variant="h5"
          sx={{
            fontFamily: '"Cormorant Garamond", serif',
            fontWeight: 600,
            color: '#8B4A6B',
            textDecoration: 'none',
            flexGrow: 1,
          }}
        >
          Hearth Swap
        </Typography>

        {/* Desktop nav links */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
          <Button component={RouterLink} to="/listings" color="inherit">
            Browse
          </Button>

          {user ? (
            <>
              <Button component={RouterLink} to="/listings/new" color="inherit">
                Create listing
              </Button>

              {/* My activity dropdown */}
              <Button
                color="inherit"
                endIcon={<KeyboardArrowDownIcon />}
                onClick={handleActivityOpen}
              >
                <Badge badgeContent={actionCount > 0 ? actionCount : 0} color="error" max={9} invisible={actionCount === 0}>
                  My activity
                </Badge>
              </Button>
              <Menu
                anchorEl={activityAnchor}
                open={Boolean(activityAnchor)}
                onClose={handleActivityClose}
              >
                <MenuItem
                  onClick={() => { handleActivityClose(); navigate('/me/offers'); }}
                >
                  My offers
                </MenuItem>
                <MenuItem
                  onClick={() => { handleActivityClose(); navigate('/me/deals'); }}
                >
                  My deals
                </MenuItem>
              </Menu>

              {/* Avatar / handle dropdown */}
              <Button
                color="inherit"
                endIcon={<KeyboardArrowDownIcon />}
                onClick={handleAvatarOpen}
              >
                @{user.handle}
              </Button>
              <Menu
                anchorEl={avatarAnchor}
                open={Boolean(avatarAnchor)}
                onClose={handleAvatarClose}
              >
                <MenuItem
                  onClick={() => { handleAvatarClose(); navigate('/me'); }}
                >
                  My profile
                </MenuItem>
                <MenuItem
                  onClick={() => { handleAvatarClose(); navigate(`/users/${user.handle}`); }}
                >
                  Public view
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleSignOut}>Sign out</MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button component={RouterLink} to="/login" variant="outlined" color="primary">
                Log in
              </Button>
              <Button component={RouterLink} to="/signup" variant="contained" color="primary">
                Sign up
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
