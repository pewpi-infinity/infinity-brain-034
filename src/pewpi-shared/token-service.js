/**
 * Token Service
 * Manages token generation, validation, and storage for the pewpi-infinity system
 */

class TokenService {
  constructor() {
    this.tokens = new Map();
    this.initialized = false;
  }

  /**
   * Initialize the token service
   */
  async init() {
    if (this.initialized) {
      console.log('[TokenService] Already initialized');
      return;
    }
    
    try {
      // Load existing tokens from storage if available
      const stored = this._loadFromStorage();
      if (stored && stored.tokens) {
        this.tokens = new Map(Object.entries(stored.tokens));
      }
      
      this.initialized = true;
      console.log('[TokenService] Initialized successfully');
    } catch (error) {
      console.error('[TokenService] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Generate a new token
   * @param {string} type - Token type (e.g., 'auth', 'session', 'api')
   * @param {object} payload - Token payload data
   * @returns {object} Token object with id, value, type, and metadata
   */
  generate(type, payload = {}) {
    if (!this.initialized) {
      throw new Error('TokenService not initialized');
    }

    const tokenId = this._generateId();
    const tokenValue = this._generateTokenValue(type, payload);
    
    const token = {
      id: tokenId,
      value: tokenValue,
      type: type,
      payload: payload,
      createdAt: Date.now(),
      expiresAt: payload.expiresAt || (Date.now() + 3600000) // Default 1 hour
    };

    this.tokens.set(tokenId, token);
    this._saveToStorage();
    
    console.log(`[TokenService] Generated token: ${tokenId} (${type})`);
    return token;
  }

  /**
   * Validate a token
   * @param {string} tokenId - Token ID to validate
   * @returns {boolean} True if token is valid
   */
  validate(tokenId) {
    if (!this.initialized) {
      throw new Error('TokenService not initialized');
    }

    const token = this.tokens.get(tokenId);
    if (!token) {
      return false;
    }

    // Check expiration
    if (Date.now() > token.expiresAt) {
      this.revoke(tokenId);
      return false;
    }

    return true;
  }

  /**
   * Get token by ID
   * @param {string} tokenId - Token ID
   * @returns {object|null} Token object or null
   */
  get(tokenId) {
    if (!this.initialized) {
      throw new Error('TokenService not initialized');
    }

    const token = this.tokens.get(tokenId);
    if (token && this.validate(tokenId)) {
      return token;
    }
    return null;
  }

  /**
   * Revoke a token
   * @param {string} tokenId - Token ID to revoke
   */
  revoke(tokenId) {
    if (!this.initialized) {
      throw new Error('TokenService not initialized');
    }

    const removed = this.tokens.delete(tokenId);
    if (removed) {
      this._saveToStorage();
      console.log(`[TokenService] Revoked token: ${tokenId}`);
    }
    return removed;
  }

  /**
   * Clean expired tokens
   */
  cleanup() {
    if (!this.initialized) {
      throw new Error('TokenService not initialized');
    }

    const now = Date.now();
    let cleaned = 0;

    for (const [tokenId, token] of this.tokens.entries()) {
      if (now > token.expiresAt) {
        this.tokens.delete(tokenId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this._saveToStorage();
      console.log(`[TokenService] Cleaned ${cleaned} expired tokens`);
    }

    return cleaned;
  }

  /**
   * Generate a unique token ID
   * @private
   */
  _generateId() {
    return `tok_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate token value
   * @private
   */
  _generateTokenValue(type, payload) {
    const data = JSON.stringify({ type, payload, timestamp: Date.now() });
    // Simple base64 encoding for token value
    if (typeof btoa !== 'undefined') {
      return btoa(data);
    } else if (typeof Buffer !== 'undefined') {
      return Buffer.from(data).toString('base64');
    }
    return data;
  }

  /**
   * Load tokens from storage
   * @private
   */
  _loadFromStorage() {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('pewpi_tokens');
        return stored ? JSON.parse(stored) : null;
      }
    } catch (error) {
      console.warn('[TokenService] Failed to load from storage:', error);
    }
    return null;
  }

  /**
   * Save tokens to storage
   * @private
   */
  _saveToStorage() {
    try {
      if (typeof localStorage !== 'undefined') {
        const data = {
          tokens: Object.fromEntries(this.tokens),
          updatedAt: Date.now()
        };
        localStorage.setItem('pewpi_tokens', JSON.stringify(data));
      }
    } catch (error) {
      console.warn('[TokenService] Failed to save to storage:', error);
    }
  }
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TokenService;
}
if (typeof window !== 'undefined') {
  window.TokenService = TokenService;
}
