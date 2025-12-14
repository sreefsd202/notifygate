// src/components/Header.jsx
import { AppBar, Toolbar, Typography, Menu, MenuItem, IconButton, Box, useMediaQuery, useTheme, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import React from 'react';
import MenuIcon from '@mui/icons-material/Menu';
import SecurityIcon from '@mui/icons-material/Security';

export const Header = () => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar 
      position="static" 
      sx={{ 
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        py: { xs: 0.5, sm: 0.5 },
        borderBottom: '1px solid #e0e0e0'
      }}
    >
      <Toolbar sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: { xs: '0 16px', sm: '0 24px', md: '0 32px' },
        minHeight: { xs: '70px', sm: '80px' }
      }}>
        
        {/* Left Section - Logo and Brand */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: { xs: '12px', sm: '16px' },
          flex: 1
        }}>
          {/* Logo */}
          <Box 
            sx={{ 
              width: { xs: '50px', sm: '60px' },
              height: { xs: '50px', sm: '60px' },
              backgroundColor: '#1e3a5f',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: { xs: '16px', sm: '18px' },
              boxShadow: '0 4px 12px rgba(30, 58, 95, 0.3)'
            }}
          >
            <SecurityIcon sx={{ fontSize: { xs: '24px', sm: '28px' } }} />
          </Box>
          
          <Box sx={{ minWidth: 0 }}>
            <Typography 
              component="div"
              sx={{ 
                fontWeight: 900,
                letterSpacing: '2px',
                fontFamily: '"Poppins", "Arial Black", sans-serif',
                color: '#1e3a5f',
                lineHeight: 1,
                whiteSpace: 'nowrap',
                fontSize: { xs: '22px', sm: '28px', md: '32px', lg: '36px' }
              }}
            >
              V-GATE
            </Typography>
            <Typography 
              variant="caption"
              sx={{
                display: { xs: 'none', sm: 'block' },
                color: '#666666',
                fontWeight: 500,
                letterSpacing: '1px',
                fontSize: '0.75rem',
                mt: 0.5
              }}
            >
              Digital Campus Access
            </Typography>
          </Box>
        </Box>

        {/* Center Section - Main Title */}
        <Box sx={{ 
          display: { xs: 'none', lg: 'flex' },
          alignItems: 'center',
          justifyContent: 'center',
          flex: 2,
          textAlign: 'center'
        }}>
          <Typography 
            variant="h5"
            sx={{
              fontWeight: 700,
              letterSpacing: '1.5px',
              fontFamily: '"Inter", "Segoe UI", sans-serif',
              color: '#1e3a5f',
              fontSize: '1.3rem',
              lineHeight: 1.3,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #1e3a5f 0%, #2d4a7a 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Automated Gate Pass Management System
          </Typography>
        </Box>

        {/* Right Section - Menu */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          flex: 1,
          justifyContent: 'flex-end'
        }}>
          {/* Menu Button */}
          <IconButton
            size={isSmallScreen ? "small" : "medium"}
            edge="end"
            aria-label="menu"
            aria-controls="basic-menu"
            aria-haspopup="true"
            onClick={handleClick}
            sx={{ 
              color: '#1e3a5f',
              padding: { xs: '8px', sm: '10px' },
              '&:hover': {
                backgroundColor: 'rgba(30, 58, 95, 0.1)'
              }
            }}
          >
            <MenuIcon sx={{ fontSize: { xs: '22px', sm: '26px' } }} />
          </IconButton>
          
          {/* Menu */}
          <Menu
            id="basic-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            MenuListProps={{
              'aria-labelledby': 'basic-button',
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: {
                mt: 2,
                minWidth: { xs: '200px', sm: '220px' },
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                border: '1px solid #e0e0e0',
                overflow: 'hidden'
              }
            }}
          >
            <Typography 
              variant="subtitle2" 
              sx={{
                px: 3,
                py: 2,
                color: '#1e3a5f',
                fontWeight: 700,
                fontSize: '0.9rem',
                borderBottom: '1px solid #f0f0f0',
                background: '#f8f9fa',
                textAlign: 'center',
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }}
            >
              Access Portal
            </Typography>
            
            <MenuItem 
              component={Link}
              to="/login/student"
              onClick={handleClose}
              sx={{
                fontSize: '1rem',
                padding: '14px 20px',
                color: '#333333',
                textDecoration: 'none',
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(30, 58, 95, 0.08) 0%, rgba(30, 58, 95, 0.04) 100%)',
                  color: '#1e3a5f'
                }
              }}
            >
              Student Login
            </MenuItem>
            
            <MenuItem 
              component={Link}
              to="/login/tutor"
              onClick={handleClose}
              sx={{
                fontSize: '1rem',
                padding: '14px 20px',
                color: '#333333',
                textDecoration: 'none',
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(30, 58, 95, 0.08) 0%, rgba(30, 58, 95, 0.04) 100%)',
                  color: '#1e3a5f'
                }
              }}
            >
              Tutor Login
            </MenuItem>
            
            <MenuItem 
              component={Link}
              to="/admin/login"
              onClick={handleClose}
              sx={{
                fontSize: '1rem',
                padding: '14px 20px',
                color: '#333333',
                textDecoration: 'none',
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(30, 58, 95, 0.08) 0%, rgba(30, 58, 95, 0.04) 100%)',
                  color: '#1e3a5f'
                }
              }}
            >
              Office Admin
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header;