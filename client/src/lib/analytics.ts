/**
 * Optional analytics initialization
 * Only loads if VITE_ANALYTICS_ENDPOINT and VITE_ANALYTICS_WEBSITE_ID are set
 */

export function initAnalytics() {
  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
  const websiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID;

  // Only load analytics if both variables are configured
  if (!endpoint || !websiteId) {
    console.info('Analytics disabled: VITE_ANALYTICS_ENDPOINT or VITE_ANALYTICS_WEBSITE_ID not set');
    return;
  }

  // Dynamically load Umami analytics script
  const script = document.createElement('script');
  script.defer = true;
  script.src = `${endpoint}/umami`;
  script.setAttribute('data-website-id', websiteId);
  document.head.appendChild(script);
  
  console.info('Analytics initialized');
}
