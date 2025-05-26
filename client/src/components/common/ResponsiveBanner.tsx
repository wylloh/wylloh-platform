import React from 'react';
import { Box, styled } from '@mui/material';

// Import optimized banner images
import bannerWebP from '../../assets/images/wylloh-hero-banner.webp';
import bannerJPEG from '../../assets/images/wylloh-hero-banner.jpeg';
import bannerTabletWebP from '../../assets/images/wylloh-hero-banner-tablet.webp';
import bannerTabletJPEG from '../../assets/images/wylloh-hero-banner-tablet.jpeg';
import bannerMobileWebP from '../../assets/images/wylloh-hero-banner-mobile.webp';
import bannerMobileJPEG from '../../assets/images/wylloh-hero-banner-mobile.jpeg';
import banner2xWebP from '../../assets/images/wylloh-hero-banner-2x.webp';
import banner2xJPEG from '../../assets/images/wylloh-hero-banner-2x.jpeg';

interface ResponsiveBannerProps {
  alt?: string;
  height?: string | number;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  priority?: boolean;
  className?: string;
  onClick?: () => void;
}

const BannerContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  position: 'relative',
  overflow: 'hidden',
  
  '& picture': {
    display: 'block',
    width: '100%',
    height: '100%',
  },
  
  '& img': {
    width: '100%',
    height: '100%',
    display: 'block',
    transition: 'transform 0.3s ease-in-out',
  },
  
  '&:hover img': {
    transform: 'scale(1.02)',
  },
  
  // Responsive height adjustments
  [theme.breakpoints.down('sm')]: {
    minHeight: '200px',
  },
  [theme.breakpoints.between('sm', 'md')]: {
    minHeight: '300px',
  },
  [theme.breakpoints.up('md')]: {
    minHeight: '400px',
  },
}));

const ResponsiveBanner: React.FC<ResponsiveBannerProps> = ({
  alt = "Wylloh Platform - Hollywood's Digital Content Hub",
  height = 'auto',
  objectFit = 'cover',
  priority = false,
  className,
  onClick
}) => {
  return (
    <BannerContainer 
      className={className}
      onClick={onClick}
      sx={{ 
        height,
        cursor: onClick ? 'pointer' : 'default'
      }}
    >
      <picture>
        {/* Mobile versions (up to 768px) */}
        <source 
          media="(max-width: 768px)" 
          srcSet={`${bannerMobileWebP} 1x, ${bannerMobileWebP} 2x`}
          type="image/webp" 
        />
        <source 
          media="(max-width: 768px)" 
          srcSet={`${bannerMobileJPEG} 1x, ${bannerMobileJPEG} 2x`}
          type="image/jpeg" 
        />
        
        {/* Tablet versions (769px to 1200px) */}
        <source 
          media="(max-width: 1200px)" 
          srcSet={`${bannerTabletWebP} 1x, ${bannerTabletWebP} 2x`}
          type="image/webp" 
        />
        <source 
          media="(max-width: 1200px)" 
          srcSet={`${bannerTabletJPEG} 1x, ${bannerTabletJPEG} 2x`}
          type="image/jpeg" 
        />
        
        {/* Desktop versions with retina support */}
        <source 
          srcSet={`${bannerWebP} 1x, ${banner2xWebP} 2x`}
          type="image/webp" 
        />
        <source 
          srcSet={`${bannerJPEG} 1x, ${banner2xJPEG} 2x`}
          type="image/jpeg" 
        />
        
        {/* Fallback image */}
        <img 
          src={bannerJPEG} 
          alt={alt}
          style={{ 
            objectFit,
            objectPosition: 'center'
          }}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      </picture>
    </BannerContainer>
  );
};

export default ResponsiveBanner; 