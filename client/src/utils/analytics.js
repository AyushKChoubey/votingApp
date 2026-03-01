/**
 * Google Analytics utility for tracking page views and events
 * Usage: Import and call initGA() once on app startup, then use tracking functions
 */

// Read GA Measurement ID from Vite env (VITE_GA_MEASUREMENT_ID)
// Set this in your .env file at project root: VITE_GA_MEASUREMENT_ID=G-ABC123DEF4
export const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

/**
 * Initialize Google Analytics
 * Call this once when the app starts
 */
export const initGA = () => {
  if (typeof window === 'undefined') {
    return; // Skip in SSR
  }
  // If no GA ID is configured, skip initialization (safe default)
  if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') {
    // Do not initialize analytics in development or without a configured ID
    // console.debug('Google Analytics not initialized: VITE_GA_MEASUREMENT_ID is not set');
    return;
  }

  // Load gtag script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer and gtag function
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID);
};

/**
 * Track a page view
 * @param {string} url - The page URL/path to track
 */
export const trackPageView = (url) => {
  if (typeof window === 'undefined' || typeof window.gtag === 'undefined') {
    // GA not loaded yet or SSR environment
    return;
  }

  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
  });
};

/**
 * Track a custom event
 * @param {string} action - Event action (e.g., 'click', 'submit')
 * @param {string} category - Event category (e.g., 'button', 'form')
 * @param {string} label - Event label (optional)
 * @param {number} value - Event value (optional)
 */
export const trackEvent = (action, category, label = null, value = null) => {
  if (typeof window === 'undefined' || typeof window.gtag === 'undefined') {
    return;
  }

  const eventParams = {
    event_category: category,
  };

  if (label) eventParams.event_label = label;
  if (value !== null) eventParams.value = value;

  window.gtag('event', action, eventParams);
};

/**
 * Track user sign up
 * @param {string} method - Sign up method (e.g., 'email', 'google')
 */
export const trackSignUp = (method) => {
  trackEvent('sign_up', 'engagement', method);
};

/**
 * Track user login
 * @param {string} method - Login method (e.g., 'email', 'google')
 */
export const trackLogin = (method) => {
  trackEvent('login', 'engagement', method);
};

/**
 * Track booth creation
 */
export const trackBoothCreated = () => {
  trackEvent('booth_created', 'engagement', 'create_booth');
};

/**
 * Track vote cast
 */
export const trackVoteCast = () => {
  trackEvent('vote_cast', 'engagement', 'voting');
};
