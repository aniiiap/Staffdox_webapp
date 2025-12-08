// Google Analytics utility functions

// Initialize Google Analytics
export const initGA = (measurementId) => {
  if (typeof window !== 'undefined' && measurementId) {
    // Load Google Analytics script
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script1);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', measurementId, {
      page_path: window.location.pathname,
    });
  }
};

// Track page views
export const trackPageView = (path) => {
  if (typeof window !== 'undefined' && window.gtag) {
    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (measurementId) {
      window.gtag('config', measurementId, {
        page_path: path,
      });
    }
  }
};

// Track custom events
export const trackEvent = (eventName, eventParams = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
};

// Common event tracking functions
export const trackJobView = (jobId, jobTitle) => {
  trackEvent('view_job', {
    job_id: jobId,
    job_title: jobTitle,
  });
};

export const trackJobApplication = (jobId, jobTitle) => {
  trackEvent('job_application', {
    job_id: jobId,
    job_title: jobTitle,
  });
};

export const trackUserRegistration = (method = 'email') => {
  trackEvent('user_registration', {
    registration_method: method,
  });
};

export const trackUserLogin = (method = 'email') => {
  trackEvent('user_login', {
    login_method: method,
  });
};

export const trackSearch = (searchQuery) => {
  trackEvent('search', {
    search_term: searchQuery,
  });
};

export const trackCVUpload = () => {
  trackEvent('cv_upload');
};

export const trackJobPost = (jobTitle) => {
  trackEvent('job_post', {
    job_title: jobTitle,
  });
};

