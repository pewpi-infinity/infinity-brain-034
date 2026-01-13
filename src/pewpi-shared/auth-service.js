/**
 * Auth Service
 * Handles authentication and authorization for the pewpi-infinity system
 */

class AuthService {
  constructor(tokenService) {
    this.tokenService = tokenService;
    this.currentUser = null;
    this.initialized = false;
    this.sessionToken = null;
  }

  /**
   * Initialize the auth service
   */
  async init() {
    if (this.initialized) {
      console.log('[AuthService] Already initialized');
      return;
    }

    try {
      // Check for existing session
      const session = this._loadSession();
      if (session) {
        await this._restoreSession(session);
      }

      this.initialized = true;
      console.log('[AuthService] Initialized successfully');
    } catch (error) {
      console.error('[AuthService] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Authenticate a user
   * @param {object} credentials - User credentials
   * @returns {object} Authentication result with user and token
   */
  async authenticate(credentials) {
    if (!this.initialized) {
      throw new Error('AuthService not initialized');
    }

    try {
      // Validate credentials
      if (!credentials || !credentials.username) {
        throw new Error('Invalid credentials');
      }

      // Create user object (in production, this would verify against a backend)
      const user = {
        id: this._generateUserId(),
        username: credentials.username,
        authenticatedAt: Date.now(),
        role: credentials.role || 'user'
      };

      // Generate session token
      const token = this.tokenService.generate('session', {
        userId: user.id,
        username: user.username,
        expiresAt: Date.now() + 86400000 // 24 hours
      });

      this.currentUser = user;
      this.sessionToken = token;
      this._saveSession({ user, token });

      console.log(`[AuthService] User authenticated: ${user.username}`);
      return { user, token };
    } catch (error) {
      console.error('[AuthService] Authentication failed:', error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} True if user is authenticated
   */
  isAuthenticated() {
    if (!this.initialized) {
      return false;
    }

    if (!this.currentUser || !this.sessionToken) {
      return false;
    }

    // Validate session token
    return this.tokenService.validate(this.sessionToken.id);
  }

  /**
   * Get current user
   * @returns {object|null} Current user or null
   */
  getCurrentUser() {
    if (!this.initialized) {
      throw new Error('AuthService not initialized');
    }

    if (this.isAuthenticated()) {
      return this.currentUser;
    }

    return null;
  }

  /**
   * Get session token
   * @returns {object|null} Session token or null
   */
  getSessionToken() {
    if (!this.initialized) {
      throw new Error('AuthService not initialized');
    }

    if (this.isAuthenticated()) {
      return this.sessionToken;
    }

    return null;
  }

  /**
   * Logout current user
   */
  async logout() {
    if (!this.initialized) {
      throw new Error('AuthService not initialized');
    }

    try {
      if (this.sessionToken) {
        this.tokenService.revoke(this.sessionToken.id);
      }

      this.currentUser = null;
      this.sessionToken = null;
      this._clearSession();

      console.log('[AuthService] User logged out');
    } catch (error) {
      console.error('[AuthService] Logout failed:', error);
      throw error;
    }
  }

  /**
   * Authorize an action
   * @param {string} action - Action to authorize
   * @param {object} context - Authorization context
   * @returns {boolean} True if authorized
   */
  authorize(action, context = {}) {
    if (!this.initialized) {
      throw new Error('AuthService not initialized');
    }

    if (!this.isAuthenticated()) {
      return false;
    }

    // Basic role-based authorization
    const user = this.getCurrentUser();
    
    // Admin can do anything
    if (user.role === 'admin') {
      return true;
    }

    // User can perform basic actions
    if (user.role === 'user') {
      const allowedActions = ['read', 'write', 'execute'];
      return allowedActions.includes(action);
    }

    return false;
  }

  /**
   * Generate user ID
   * @private
   */
  _generateUserId() {
    return `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Restore session from storage
   * @private
   */
  async _restoreSession(session) {
    try {
      if (session.token && this.tokenService.validate(session.token.id)) {
        this.currentUser = session.user;
        this.sessionToken = session.token;
        console.log(`[AuthService] Session restored for: ${session.user.username}`);
      } else {
        this._clearSession();
      }
    } catch (error) {
      console.warn('[AuthService] Failed to restore session:', error);
      this._clearSession();
    }
  }

  /**
   * Load session from storage
   * @private
   */
  _loadSession() {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('pewpi_session');
        return stored ? JSON.parse(stored) : null;
      }
    } catch (error) {
      console.warn('[AuthService] Failed to load session:', error);
    }
    return null;
  }

  /**
   * Save session to storage
   * @private
   */
  _saveSession(session) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('pewpi_session', JSON.stringify(session));
      }
    } catch (error) {
      console.warn('[AuthService] Failed to save session:', error);
    }
  }

  /**
   * Clear session from storage
   * @private
   */
  _clearSession() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('pewpi_session');
      }
    } catch (error) {
      console.warn('[AuthService] Failed to clear session:', error);
    }
  }
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthService;
}
if (typeof window !== 'undefined') {
  window.AuthService = AuthService;
}
