/**
 * Google Analytics 4 (GA4) Tracking
 *
 * SETUP INSTRUCTIONS:
 * Replace 'G-XXXXXXXXXX' below with your actual Google Analytics Measurement ID
 *
 * To get your Measurement ID:
 * 1. Go to https://analytics.google.com/
 * 2. Create an account or sign in
 * 3. Create a new property for your website
 * 4. Your Measurement ID will be shown (format: G-XXXXXXXXXX)
 */

(function() {
  'use strict';

  // Google Analytics Measurement ID
  const GA_MEASUREMENT_ID = 'G-5ETGE0Q37E';

  // Only load Google Analytics if a valid measurement ID is configured
  if (GA_MEASUREMENT_ID && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX') {

    // Load Google Analytics gtag.js script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    // Initialize gtag data layer
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, {
      // Optional: Send page view on load
      'send_page_view': true,
      // Optional: Anonymize IP addresses for privacy
      'anonymize_ip': true,
      // Optional: Cookie flags for compliance
      'cookie_flags': 'SameSite=None;Secure'
    });

    console.log('[Analytics] Google Analytics initialized with ID:', GA_MEASUREMENT_ID);

  } else {
    console.warn('[Analytics] Google Analytics not configured. Please set your Measurement ID in assets/analytics.js');
  }

})();
