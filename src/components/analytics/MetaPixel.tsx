import { useEffect } from "react";
import { useLocation } from "react-router-dom";

type FbqFunction = ((event: string, ...args: unknown[]) => void) & {
  push?: FbqFunction;
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
};

declare global {
  interface Window {
    fbq?: FbqFunction;
    _fbq?: FbqFunction;
  }
}

const META_PIXEL_ID = "1324561636064991";

const MetaPixel: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const w = window;

    if (!w.fbq) {
      const fbq: FbqFunction = function (...args: unknown[]) {
        if (fbq.callMethod) {
          fbq.callMethod(...args);
        } else {
          (fbq.queue ??= []).push(args);
        }
      } as FbqFunction;

      fbq.push = fbq;
      fbq.loaded = true;
      fbq.version = "2.0";
      fbq.queue = [];

      w.fbq = fbq;
      w._fbq = fbq;

      const script = document.createElement("script");
      script.async = true;
      script.src = "https://connect.facebook.net/en_US/fbevents.js";
      const firstScript = document.getElementsByTagName("script")[0];
      firstScript?.parentNode?.insertBefore(script, firstScript);

      const img = document.createElement("img");
      img.height = 1;
      img.width = 1;
      img.style.display = "none";
      img.src = `https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`;
      img.setAttribute("alt", "");
      document.body.appendChild(img);
    }

    w.fbq?.("init", META_PIXEL_ID);
    w.fbq?.("track", "PageView");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fbq = window.fbq;
    if (typeof fbq !== "function") return;
    fbq("track", "PageView");
  }, [location.pathname, location.search]);

  return null;
};

export default MetaPixel;