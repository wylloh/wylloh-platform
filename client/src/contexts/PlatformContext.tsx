import React, { createContext, useContext, useState, useEffect } from 'react';

interface PlatformContextType {
  isSeedOne: boolean;
  isTouchDevice: boolean;
  isKioskMode: boolean;
}

const PlatformContext = createContext<PlatformContextType>({
  isSeedOne: false,
  isTouchDevice: false,
  isKioskMode: false
});

export const usePlatform = () => useContext(PlatformContext);

interface PlatformProviderProps {
  children: React.ReactNode;
}

export const PlatformProvider: React.FC<PlatformProviderProps> = ({ children }) => {
  const [isSeedOne, setIsSeedOne] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isKioskMode, setIsKioskMode] = useState(false);
  
  useEffect(() => {
    // Detect if we're running on Seed One hardware
    // There are several ways we might detect this:
    // 1. URL parameter (e.g., ?platform=seedone)
    // 2. Local storage flag
    // 3. User agent detection for kiosk mode
    
    // Check for URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const platformParam = urlParams.get('platform');
    
    // Check local storage
    const storedPlatform = localStorage.getItem('wylloh-platform');
    
    // Check for kiosk mode in user agent
    const isKiosk = 
      window.navigator.userAgent.includes('Kiosk') || 
      window.navigator.userAgent.includes('Electron');
    
    const isSeedOnePlatform = 
      platformParam === 'seedone' || 
      storedPlatform === 'seedone' || 
      isKiosk;
    
    setIsSeedOne(isSeedOnePlatform);
    setIsKioskMode(isKiosk);
    
    // Also check if this is a touch-capable device
    const isTouchCapable = 
      ('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0) ||
      // @ts-ignore
      (navigator.msMaxTouchPoints > 0);
    
    setIsTouchDevice(isTouchCapable);
    
    // Check for fullscreen/kiosk mode changes
    const handleResize = () => {
      const isFullScreen = window.innerWidth === window.screen.width && window.innerHeight === window.screen.height;
      if (isFullScreen && !isKiosk) {
        setIsKioskMode(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  const value = { isSeedOne, isTouchDevice, isKioskMode };
  
  return (
    <PlatformContext.Provider value={value}>
      {children}
    </PlatformContext.Provider>
  );
};

export default PlatformProvider; 