import { useState, useEffect } from 'react';

/**
 * Custom hook to detect virtual keyboard state on mobile devices
 * Helps optimize UI layout when virtual keyboard is open
 */
export function useVirtualKeyboard() {
  const [isVirtualKeyboardOpen, setIsVirtualKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initialViewportHeight = window.visualViewport?.height || window.innerHeight;
    let currentViewportHeight = initialViewportHeight;

    const handleViewportChange = () => {
      if (window.visualViewport) {
        const newHeight = window.visualViewport.height;
        const heightDifference = initialViewportHeight - newHeight;
        
        // Consider keyboard open if viewport height decreased by more than 150px
        const isKeyboardOpen = heightDifference > 150;
        
        setIsVirtualKeyboardOpen(isKeyboardOpen);
        setKeyboardHeight(isKeyboardOpen ? heightDifference : 0);
        currentViewportHeight = newHeight;
      }
    };

    // Fallback for browsers without visualViewport support
    const handleResize = () => {
      if (!window.visualViewport) {
        const newHeight = window.innerHeight;
        const heightDifference = initialViewportHeight - newHeight;
        const isKeyboardOpen = heightDifference > 150;
        
        setIsVirtualKeyboardOpen(isKeyboardOpen);
        setKeyboardHeight(isKeyboardOpen ? heightDifference : 0);
      }
    };

    // Use visualViewport if available (modern browsers)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
    } else {
      // Fallback for older browsers
      window.addEventListener('resize', handleResize);
    }

    // Cleanup
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
      } else {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  return {
    isVirtualKeyboardOpen,
    keyboardHeight,
  };
}

export default useVirtualKeyboard;

