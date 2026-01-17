/**
 * Optional analytics initialization
 * Only loads if VITE_ANALYTICS_ENDPOINT and VITE_ANALYTICS_WEBSITE_ID are set
 */

export function initAnalytics() {
  try {
    const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
    const websiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID;

    // Only load analytics if both variables are configured and non-empty strings
    if (
      typeof endpoint !== 'string' || 
      typeof websiteId !== 'string' || 
      endpoint.trim() === '' || 
      websiteId.trim() === '' ||
      endpoint === 'undefined' ||
      websiteId === 'undefined'
    ) {
      console.info('[Analytics] Disabled: environment variables not configured');
      return;
    }

    // Validate endpoint is a valid URL
    try {
      new URL(endpoint);
    } catch {
      console.warn('[Analytics] Invalid endpoint URL:', endpoint);
      return;
    }

    // Dynamically load Umami analytics script
    const script = document.createElement('script');
    script.defer = true;
    script.src = `${endpoint}/umami`;
    script.setAttribute('data-website-id', websiteId);
    
    script.onerror = () => {
      console.warn('[Analytics] Failed to load analytics script');
    };
    
    document.head.appendChild(script);
    console.info('[Analytics] Initialized successfully');
  } catch (error) {
    console.error('[Analytics] Initialization error:', error);
  }
}
