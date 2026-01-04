/**
 * Authentication utility for MyBudgetHub
 * Handles authentication state checking and UI updates on every page load
 */

const API_BASE_URL = 'http://127.0.0.1:5000';

/**
 * Check authentication status from the server
 * @returns {Promise<{authenticated: boolean, email?: string}>}
 */
async function checkAuthStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/status`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      return { authenticated: false };
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking auth status:', error);
    return { authenticated: false };
  }
}

/**
 * Initialize auth-aware UI on page load
 * @param {Object} options - Configuration options
 * @param {boolean} options.requireAuth - If true, redirect to frontpage if not authenticated
 * @param {boolean} options.redirectIfAuth - If true, redirect to index.html if authenticated
 * @param {Function} options.onAuthStateChange - Callback when auth state changes
 */
async function initAuth(options = {}) {
  const {
    requireAuth = false,
    redirectIfAuth = false,
    onAuthStateChange = null
  } = options;

  const authState = await checkAuthStatus();
  
  // Call callback if provided
  if (onAuthStateChange) {
    onAuthStateChange(authState);
  }

  // Handle redirects based on auth state
  if (requireAuth && !authState.authenticated) {
    // Redirect to frontpage if authentication is required but user is not authenticated
    window.location.href = 'frontpage.html';
    return;
  }

  if (redirectIfAuth && authState.authenticated) {
    // Redirect to dashboard if user is authenticated but shouldn't be on this page
    window.location.href = 'index.html';
    return;
  }

  // Update UI elements based on auth state
  updateUIForAuth(authState);

  return authState;
}

/**
 * Update UI elements based on authentication state
 * @param {Object} authState - Authentication state object
 */
function updateUIForAuth(authState) {
  // Update elements with data-auth attribute
  document.querySelectorAll('[data-auth="authenticated"]').forEach(el => {
    el.style.display = authState.authenticated ? '' : 'none';
  });

  document.querySelectorAll('[data-auth="unauthenticated"]').forEach(el => {
    el.style.display = authState.authenticated ? 'none' : '';
  });

  // Update user email if element exists
  const userEmailElements = document.querySelectorAll('[data-user-email]');
  userEmailElements.forEach(el => {
    if (authState.authenticated && authState.email) {
      el.textContent = authState.email;
      el.style.display = '';
    } else {
      el.style.display = 'none';
    }
  });

  // Update logout button visibility
  const logoutButtons = document.querySelectorAll('[data-logout-btn]');
  logoutButtons.forEach(btn => {
    btn.style.display = authState.authenticated ? '' : 'none';
  });
}

/**
 * Logout function
 * @returns {Promise<void>}
 */
async function logout() {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    
    // Clear any cached auth state
    window.location.href = 'frontpage.html';
  } catch (error) {
    console.error('Error logging out:', error);
    // Still redirect even if logout fails
    window.location.href = 'frontpage.html';
  }
}

/**
 * Setup logout button handlers
 */
function setupLogoutButtons() {
  document.querySelectorAll('[data-logout-btn]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      btn.disabled = true;
      btn.textContent = 'Logging out...';
      await logout();
    });
  });
}

// Auto-setup logout buttons when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupLogoutButtons);
} else {
  setupLogoutButtons();
}

// Make functions available globally
window.initAuth = initAuth;
window.checkAuthStatus = checkAuthStatus;
window.logout = logout;
window.updateUIForAuth = updateUIForAuth;

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initAuth, checkAuthStatus, logout, updateUIForAuth };
}

