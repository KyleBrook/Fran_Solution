import { useEffect } from "react";
import { useLocation } from "react-router-dom";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const MetaPixel: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fbq = window.fbq;
    if (typeof fbq !== "function") return;

    fbq("track", "PageView");
  }, [location.pathname, location.search]);

  return null;
};

export default MetaPixel;