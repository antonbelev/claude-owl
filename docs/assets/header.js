/**
 * Shared Header Component Loader
 * Loads the navigation header and sets the active page indicator
 */

(function() {
  'use strict';

  // Load header component
  async function loadHeader() {
    try {
      const response = await fetch('components/header.html');
      if (!response.ok) {
        throw new Error(`Failed to load header: ${response.status}`);
      }

      const headerHTML = await response.text();

      // Insert header at the beginning of body
      const headerContainer = document.createElement('div');
      headerContainer.innerHTML = headerHTML;
      document.body.insertBefore(headerContainer.firstElementChild, document.body.firstChild);

      // Set active navigation item
      setActiveNavItem();

    } catch (error) {
      console.error('Error loading header:', error);
    }
  }

  // Set active navigation item based on current page
  function setActiveNavItem() {
    // Get page identifier from body data attribute
    const pageId = document.body.getAttribute('data-page');

    if (!pageId) {
      console.warn('No data-page attribute found on body element');
      return;
    }

    // Handle special case for home page
    if (pageId === 'home') {
      // On home page: hide "Home" link, show "Features" link
      const homeLink = document.querySelector('.nav-home');
      const featuresLink = document.querySelector('.nav-features');

      if (homeLink) homeLink.style.display = 'none';
      if (featuresLink) {
        featuresLink.style.display = 'inline';
        featuresLink.classList.add('text-blue-400');
      }
    } else {
      // On other pages: show "Home" link, hide "Features" link
      const homeLink = document.querySelector('.nav-home');
      const featuresLink = document.querySelector('.nav-features');

      if (homeLink) homeLink.style.display = 'inline';
      if (featuresLink) featuresLink.style.display = 'none';

      // Set active class on current page
      const activeLink = document.querySelector(`.nav-${pageId}`);
      if (activeLink) {
        activeLink.classList.add('text-blue-400');
      }
    }
  }

  // Load header when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadHeader);
  } else {
    loadHeader();
  }
})();
