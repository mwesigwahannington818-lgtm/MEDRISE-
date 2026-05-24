import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setAuthTokenGetter } from "@workspace/api-client-react";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

setAuthTokenGetter(() => localStorage.getItem("medrise_admin_token"));

// Google Analytics
if (typeof window !== "undefined") {
  const GA_ID = import.meta.env.VITE_GA_ID || "G-XXXXXXXXXX"; // Replace with your actual GA4 ID

  // Load Google Analytics script
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer?.push(arguments);
  }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", GA_ID, {
    page_path: window.location.pathname,
  });
}

createRoot(document.getElementById("root")!).render(<App />);
