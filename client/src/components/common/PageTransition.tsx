import React, { ReactNode } from 'react';
import { Box, Fade, Slide, useTheme } from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';

interface PageTransitionProps {
  children: ReactNode;
  variant?: 'fade' | 'slide' | 'none';
  direction?: 'up' | 'down' | 'left' | 'right';
  timeout?: number;
  in?: boolean;
  className?: string;
}

/**
 * PageTransition - Provides smooth transitions between pages
 * Enhances user experience with professional animations
 */
const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  variant = 'fade',
  direction = 'up',
  timeout = 300,
  in: inProp = true,
  className
}) => {
  const theme = useTheme();

  if (variant === 'none') {
    return <Box className={className}>{children}</Box>;
  }

  if (variant === 'slide') {
    return (
      <Slide
        direction={direction}
        in={inProp}
        timeout={timeout}
        className={className}
      >
        <Box>{children}</Box>
      </Slide>
    );
  }

  // Default to fade transition
  return (
    <Fade
      in={inProp}
      timeout={timeout}
      className={className}
    >
      <Box>{children}</Box>
    </Fade>
  );
};

export default PageTransition; 