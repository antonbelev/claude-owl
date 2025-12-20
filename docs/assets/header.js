/**
 * Shared Header Component Loader
 * Embeds the navigation header and sets the active page indicator
 * Note: Uses inline HTML instead of fetch to avoid CORS issues when testing locally with file:// protocol
 */

(function() {
  'use strict';

  // Header HTML template
  const headerHTML = `
    <!-- Navigation -->
    <nav class="fixed top-0 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-700 z-50">
      <div class="container mx-auto px-6 py-4 flex justify-between items-center">
        <div class="flex items-center space-x-3">
          <a href="index.html" class="flex items-center space-x-3">
            <span class="text-3xl">🦉</span>
            <span class="text-xl font-bold">Claude Owl</span>
          </a>
          <span class="text-xs bg-orange-600 px-2 py-1 rounded-full font-semibold">BETA</span>
          <span id="version-badge" class="text-xs bg-blue-600 px-2 py-1 rounded-full">Loading...</span>
        </div>
        <div class="hidden md:flex space-x-6">
          <a href="index.html" class="nav-home hover:text-blue-400 transition">Home</a>
          <a href="index.html#features" class="nav-features hover:text-blue-400 transition">Features</a>
          <a href="screenshots.html" class="nav-screenshots hover:text-blue-400 transition">Screenshots</a>
          <a href="changelog.html" class="nav-changelog hover:text-blue-400 transition">Changelog</a>
          <a href="installation.html" class="nav-installation hover:text-blue-400 transition">Installation</a>
          <a href="security.html" class="nav-security hover:text-blue-400 transition">Security</a>
          <a href="https://github.com/antonbelev/claude-owl" target="_blank" class="hover:text-blue-400 transition">GitHub</a>
        </div>
        <button id="mobile-menu-btn" class="md:hidden text-white">
          <svg id="menu-icon" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
          <svg id="close-icon" class="w-6 h-6 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Mobile Menu -->
      <div id="mobile-menu" class="hidden md:hidden bg-slate-900 border-t border-slate-700">
        <div class="container mx-auto px-6 py-4 flex flex-col space-y-4">
          <a href="index.html" class="nav-home-mobile hover:text-blue-400 transition py-2">Home</a>
          <a href="index.html#features" class="nav-features-mobile hover:text-blue-400 transition py-2">Features</a>
          <a href="screenshots.html" class="nav-screenshots-mobile hover:text-blue-400 transition py-2">Screenshots</a>
          <a href="changelog.html" class="nav-changelog-mobile hover:text-blue-400 transition py-2">Changelog</a>
          <a href="installation.html" class="nav-installation-mobile hover:text-blue-400 transition py-2">Installation</a>
          <a href="security.html" class="nav-security-mobile hover:text-blue-400 transition py-2">Security</a>
          <a href="https://github.com/antonbelev/claude-owl" target="_blank" class="hover:text-blue-400 transition py-2">GitHub</a>
        </div>
      </div>
    </nav>
  `;

  // Load header component
  function loadHeader() {
    try {
      // Insert header at the beginning of body
      const headerContainer = document.createElement('div');
      headerContainer.innerHTML = headerHTML;
      document.body.insertBefore(headerContainer.firstElementChild, document.body.firstChild);

      // Set active navigation item
      setActiveNavItem();

      // Setup mobile menu toggle
      setupMobileMenuToggle();

    } catch (error) {
      console.error('Error loading header:', error);
    }
  }

  // Setup mobile menu toggle functionality
  function setupMobileMenuToggle() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuIcon = document.getElementById('menu-icon');
    const closeIcon = document.getElementById('close-icon');

    if (menuBtn && mobileMenu && menuIcon && closeIcon) {
      menuBtn.addEventListener('click', () => {
        const isHidden = mobileMenu.classList.contains('hidden');

        if (isHidden) {
          // Show menu
          mobileMenu.classList.remove('hidden');
          menuIcon.classList.add('hidden');
          closeIcon.classList.remove('hidden');
        } else {
          // Hide menu
          mobileMenu.classList.add('hidden');
          menuIcon.classList.remove('hidden');
          closeIcon.classList.add('hidden');
        }
      });

      // Close mobile menu when clicking on a link
      const mobileLinks = mobileMenu.querySelectorAll('a');
      mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
          mobileMenu.classList.add('hidden');
          menuIcon.classList.remove('hidden');
          closeIcon.classList.add('hidden');
        });
      });
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
