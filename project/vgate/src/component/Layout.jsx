import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, useMediaQuery, useTheme } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import collegeLogo from "../assets/collegeLogo.png";

const Layout = () => {
  const carouselImages = [
    "https://cache.careers360.mobi/media/presets/720X480/colleges/social-media/media-gallery/14090/2018/9/19/Campus%20View%20Vimala%20College%20Thrissur_Campus-view.jpg",
    "https://scontent.fcok6-2.fna.fbcdn.net/v/t1.6435-9/79537500_105576504278967_3131303983696576512_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=4W_loCyLba4Q7kNvwEgufOy&_nc_oc=AdlcBH82EugFOkw1Lme1NW_DXlhq_nubURYM1xC_42ABW7C8uGTVxVdoDuR-jaWZg5o&_nc_zt=23&_nc_ht=scontent.fcok6-2.fna&_nc_gid=l2HCQEzDxr5_YKmAYSqnkw&oh=00_AfP3NzQNPZqSIo2QeedWI76xLWzxRL12Ul7eNnamIANZ7Q&oe=688A17B9",
    "https://www.sikshapedia.com/public/data/colleges/vimala-college-thrissur-kerala/vimala-college-thrissur-kerala-banner.webp"
    
  ];
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{
      position: 'relative',
      width: '100%',
      height: 'calc(100vh - 64px)',
      overflow: 'hidden'
    }}>
      {/* Carousel Container */}
      <Box
        sx={{
          backgroundImage: `url(${carouselImages[currentIndex]})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          width: '100%',
          height: '100%',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.3)'
          }
        }}
      />
      
      {/* Navigation Arrows */}
      <IconButton
        sx={{ 
          position: 'absolute', 
          left: isMobile ? 8 : 16, 
          top: '50%', 
          zIndex: 2, 
          color: 'white',
          backgroundColor: 'rgba(0,0,0,0.5)',
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.7)'
          },
          width: isMobile ? 40 : 48,
          height: isMobile ? 40 : 48
        }}
        onClick={() => setCurrentIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length)}
      >
        <ChevronLeft fontSize={isMobile ? "medium" : "large"} />
      </IconButton>
      <IconButton
        sx={{ 
          position: 'absolute', 
          right: isMobile ? 8 : 16, 
          top: '50%', 
          zIndex: 2, 
          color: 'white',
          backgroundColor: 'rgba(0,0,0,0.5)',
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.7)'
          },
          width: isMobile ? 40 : 48,
          height: isMobile ? 40 : 48
        }}
        onClick={() => setCurrentIndex((prev) => (prev + 1) % carouselImages.length)}
      >
        <ChevronRight fontSize={isMobile ? "medium" : "large"} />
      </IconButton>
      
      {/* College Name Overlay */}
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        color: 'white',
        zIndex: 2,
        width: '100%',
        px: 2
      }}>
        <img 
          src={collegeLogo} 
          alt="Vimala College Logo" 
          style={{ 
            height: isMobile ? '100px' : isTablet ? '140px' : '180px',
            marginBottom: isMobile ? '12px' : '20px',
            filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5))',
            maxWidth: '90%'
          }} 
        />
        <Typography variant="h2" component="h1" sx={{ 
          fontWeight: 'bold',
          textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
          fontSize: isMobile ? '1.5rem' : isTablet ? '2.5rem' : '3.5rem',
          letterSpacing: '0.1em',
          fontFamily: '"Arial Black", sans-serif',
          mb: isMobile ? 0.5 : 1,
          lineHeight: 1.2,
          px: 2
        }}>
          Vimala College (Autonomous), Thrissur
        </Typography>
        
        {/* System description */}
        <Typography variant="h5" component="p" sx={{
          textShadow: '1px 1px 4px rgba(0,0,0,0.8)',
          fontSize: isMobile ? '0.9rem' : isTablet ? '1.25rem' : '1.5rem',
          maxWidth: '800px',
          margin: '0 auto',
          fontFamily: '"Arial", sans-serif',
          fontWeight: 500,
          lineHeight: 1.3,
          px: 2,
          mt: isMobile ? 0.5 : 1
        }}>
          Official Digital Gate Pass Management System
        </Typography>
        
        <Typography variant="body1" sx={{
          textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
          fontSize: isMobile ? '0.7rem' : '0.9rem',
          maxWidth: '600px',
          margin: isMobile ? '0.5rem auto 0' : '1rem auto 0',
          fontStyle: 'italic',
          opacity: 0.9,
          px: 2
        }}>
          Secure, paperless entry authorization for students and staff
        </Typography>
      </Box>
    </Box>
  );
}

export default Layout;