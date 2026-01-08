/**
 * UI Shim
 * Lightweight UI helpers and components for the pewpi-infinity system
 * Provides defensive DOM manipulation and event handling
 */

class UIShim {
  constructor() {
    this.initialized = false;
    this.components = new Map();
  }

  /**
   * Initialize the UI shim
   */
  async init() {
    if (this.initialized) {
      console.log('[UIShim] Already initialized');
      return;
    }

    try {
      // Check if DOM is available
      if (typeof document === 'undefined') {
        throw new Error('DOM not available');
      }

      this.initialized = true;
      console.log('[UIShim] Initialized successfully');
    } catch (error) {
      console.error('[UIShim] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Safely query DOM element
   * @param {string} selector - CSS selector
   * @param {Element} context - Optional context element
   * @returns {Element|null} Element or null
   */
  query(selector, context = document) {
    if (!this.initialized) {
      throw new Error('UIShim not initialized');
    }

    try {
      return context.querySelector(selector);
    } catch (error) {
      console.warn(`[UIShim] Query failed for '${selector}':`, error);
      return null;
    }
  }

  /**
   * Safely query all matching DOM elements
   * @param {string} selector - CSS selector
   * @param {Element} context - Optional context element
   * @returns {Array} Array of elements
   */
  queryAll(selector, context = document) {
    if (!this.initialized) {
      throw new Error('UIShim not initialized');
    }

    try {
      return Array.from(context.querySelectorAll(selector));
    } catch (error) {
      console.warn(`[UIShim] QueryAll failed for '${selector}':`, error);
      return [];
    }
  }

  /**
   * Create a DOM element
   * @param {string} tag - HTML tag name
   * @param {object} attrs - Element attributes
   * @param {string|Element|Array} children - Child content
   * @returns {Element} Created element
   */
  create(tag, attrs = {}, children = null) {
    if (!this.initialized) {
      throw new Error('UIShim not initialized');
    }

    try {
      const element = document.createElement(tag);

      // Set attributes
      for (const [key, value] of Object.entries(attrs)) {
        if (key === 'className') {
          element.className = value;
        } else if (key === 'style' && typeof value === 'object') {
          Object.assign(element.style, value);
        } else if (key.startsWith('on') && typeof value === 'function') {
          const event = key.substring(2).toLowerCase();
          element.addEventListener(event, value);
        } else {
          element.setAttribute(key, value);
        }
      }

      // Add children
      if (children) {
        if (Array.isArray(children)) {
          children.forEach(child => {
            if (typeof child === 'string') {
              element.appendChild(document.createTextNode(child));
            } else if (child instanceof Element) {
              element.appendChild(child);
            }
          });
        } else if (typeof children === 'string') {
          element.textContent = children;
        } else if (children instanceof Element) {
          element.appendChild(children);
        }
      }

      return element;
    } catch (error) {
      console.error('[UIShim] Create failed:', error);
      throw error;
    }
  }

  /**
   * Safely add event listener
   * @param {Element|string} target - Target element or selector
   * @param {string} event - Event type
   * @param {Function} handler - Event handler
   * @param {object} options - Event options
   * @returns {Function} Cleanup function
   */
  on(target, event, handler, options = {}) {
    if (!this.initialized) {
      throw new Error('UIShim not initialized');
    }

    try {
      const element = typeof target === 'string' ? this.query(target) : target;
      
      if (!element) {
        console.warn(`[UIShim] Element not found for event '${event}'`);
        return () => {};
      }

      element.addEventListener(event, handler, options);

      // Return cleanup function
      return () => {
        element.removeEventListener(event, handler, options);
      };
    } catch (error) {
      console.error(`[UIShim] Event binding failed for '${event}':`, error);
      return () => {};
    }
  }

  /**
   * Show a toast notification
   * @param {string} message - Toast message
   * @param {object} options - Toast options
   */
  toast(message, options = {}) {
    if (!this.initialized) {
      throw new Error('UIShim not initialized');
    }

    const {
      type = 'info',
      duration = 3000,
      position = 'bottom-right'
    } = options;

    const toast = this.create('div', {
      className: `pewpi-toast pewpi-toast-${type}`,
      style: {
        position: 'fixed',
        padding: '12px 16px',
        borderRadius: '8px',
        background: type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#007bff',
        color: 'white',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: '10000',
        opacity: '0',
        transition: 'opacity 0.3s ease',
        maxWidth: '300px',
        wordWrap: 'break-word'
      }
    }, message);

    // Set position
    const positions = {
      'top-left': { top: '20px', left: '20px' },
      'top-right': { top: '20px', right: '20px' },
      'bottom-left': { bottom: '20px', left: '20px' },
      'bottom-right': { bottom: '20px', right: '20px' }
    };
    Object.assign(toast.style, positions[position] || positions['bottom-right']);

    document.body.appendChild(toast);

    // Fade in
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
    });

    // Auto remove
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentNode) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, duration);
  }

  /**
   * Register a UI component
   * @param {string} componentId - Component identifier
   * @param {object} component - Component implementation
   */
  registerComponent(componentId, component) {
    if (!this.initialized) {
      throw new Error('UIShim not initialized');
    }

    this.components.set(componentId, component);
    console.log(`[UIShim] Registered component: ${componentId}`);
  }

  /**
   * Get a registered component
   * @param {string} componentId - Component identifier
   * @returns {object|null} Component or null
   */
  getComponent(componentId) {
    if (!this.initialized) {
      throw new Error('UIShim not initialized');
    }

    return this.components.get(componentId) || null;
  }

  /**
   * Show a loading indicator
   * @param {string} message - Loading message
   * @returns {object} Loading controller
   */
  showLoading(message = 'Loading...') {
    if (!this.initialized) {
      throw new Error('UIShim not initialized');
    }

    const overlay = this.create('div', {
      className: 'pewpi-loading-overlay',
      style: {
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: '9999'
      }
    });

    const loader = this.create('div', {
      style: {
        background: 'white',
        padding: '20px 30px',
        borderRadius: '8px',
        textAlign: 'center'
      }
    }, message);

    overlay.appendChild(loader);
    document.body.appendChild(overlay);

    return {
      hide: () => {
        if (overlay.parentNode) {
          document.body.removeChild(overlay);
        }
      }
    };
  }
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIShim;
}
if (typeof window !== 'undefined') {
  window.UIShim = UIShim;
}
