/**
 * Google Ads conversion tracking helper
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Track registration conversion in Google Ads
 */
export function trackRegistrationConversion() {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "conversion", {
      send_to: "AW-1046599495/ba-7CJzUn7EbEMeuh_MD",
    });
    console.log("✅ Google Ads registration conversion tracked");
  }
}
