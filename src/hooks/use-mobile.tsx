
import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  // Initialize to false for server-side rendering and initial client render before useEffect runs.
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // This function will only run on the client.
    const updateMobileStatus = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Set the initial status on client mount.
    updateMobileStatus();

    // Add event listener for window resize.
    window.addEventListener("resize", updateMobileStatus);

    // Clean up event listener on component unmount.
    return () => window.removeEventListener("resize", updateMobileStatus);
  }, []); // Empty dependency array ensures this runs once on mount and cleans up on unmount.

  return isMobile;
}
