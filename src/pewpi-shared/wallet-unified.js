/**
 * Wallet Unified
 * Unified wallet service for managing cryptocurrency wallets and transactions
 * Supports multiple wallet types and blockchain integrations
 */

class WalletUnified {
  constructor(authService) {
    this.authService = authService;
    this.wallets = new Map();
    this.initialized = false;
    this.defaultWallet = null;
  }

  /**
   * Initialize the wallet service
   */
  async init() {
    if (this.initialized) {
      console.log('[WalletUnified] Already initialized');
      return;
    }

    try {
      // Load existing wallets from storage
      const stored = this._loadFromStorage();
      if (stored && stored.wallets) {
        for (const [id, wallet] of Object.entries(stored.wallets)) {
          this.wallets.set(id, wallet);
        }
        this.defaultWallet = stored.defaultWallet || null;
      }

      this.initialized = true;
      console.log('[WalletUnified] Initialized successfully');
    } catch (error) {
      console.error('[WalletUnified] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create a new wallet
   * @param {object} config - Wallet configuration
   * @returns {object} Created wallet
   */
  async createWallet(config = {}) {
    if (!this.initialized) {
      throw new Error('WalletUnified not initialized');
    }

    // Check authentication
    if (!this.authService.isAuthenticated()) {
      throw new Error('User not authenticated');
    }

    try {
      const user = this.authService.getCurrentUser();
      
      const wallet = {
        id: this._generateWalletId(),
        userId: user.id,
        type: config.type || 'ethereum',
        address: this._generateAddress(config.type),
        balance: 0,
        createdAt: Date.now(),
        name: config.name || `Wallet ${this.wallets.size + 1}`,
        metadata: config.metadata || {}
      };

      this.wallets.set(wallet.id, wallet);

      // Set as default if first wallet
      if (this.wallets.size === 1) {
        this.defaultWallet = wallet.id;
      }

      this._saveToStorage();
      console.log(`[WalletUnified] Created wallet: ${wallet.id} (${wallet.type})`);
      
      return wallet;
    } catch (error) {
      console.error('[WalletUnified] Wallet creation failed:', error);
      throw error;
    }
  }

  /**
   * Get wallet by ID
   * @param {string} walletId - Wallet ID
   * @returns {object|null} Wallet or null
   */
  getWallet(walletId) {
    if (!this.initialized) {
      throw new Error('WalletUnified not initialized');
    }

    const wallet = this.wallets.get(walletId);
    
    // Verify ownership
    if (wallet && this.authService.isAuthenticated()) {
      const user = this.authService.getCurrentUser();
      if (wallet.userId === user.id) {
        return wallet;
      }
    }

    return null;
  }

  /**
   * Get all wallets for current user
   * @returns {Array} Array of wallets
   */
  getUserWallets() {
    if (!this.initialized) {
      throw new Error('WalletUnified not initialized');
    }

    if (!this.authService.isAuthenticated()) {
      return [];
    }

    const user = this.authService.getCurrentUser();
    const userWallets = [];

    for (const wallet of this.wallets.values()) {
      if (wallet.userId === user.id) {
        userWallets.push(wallet);
      }
    }

    return userWallets;
  }

  /**
   * Get default wallet
   * @returns {object|null} Default wallet or null
   */
  getDefaultWallet() {
    if (!this.initialized) {
      throw new Error('WalletUnified not initialized');
    }

    if (this.defaultWallet) {
      return this.getWallet(this.defaultWallet);
    }

    return null;
  }

  /**
   * Set default wallet
   * @param {string} walletId - Wallet ID to set as default
   */
  setDefaultWallet(walletId) {
    if (!this.initialized) {
      throw new Error('WalletUnified not initialized');
    }

    const wallet = this.getWallet(walletId);
    if (wallet) {
      this.defaultWallet = walletId;
      this._saveToStorage();
      console.log(`[WalletUnified] Set default wallet: ${walletId}`);
      return true;
    }

    return false;
  }

  /**
   * Update wallet balance
   * @param {string} walletId - Wallet ID
   * @param {number} balance - New balance
   */
  updateBalance(walletId, balance) {
    if (!this.initialized) {
      throw new Error('WalletUnified not initialized');
    }

    const wallet = this.getWallet(walletId);
    if (wallet) {
      wallet.balance = balance;
      wallet.lastUpdated = Date.now();
      this._saveToStorage();
      console.log(`[WalletUnified] Updated balance for ${walletId}: ${balance}`);
      return true;
    }

    return false;
  }

  /**
   * Create a transaction
   * @param {object} txData - Transaction data
   * @returns {object} Transaction result
   */
  async createTransaction(txData) {
    if (!this.initialized) {
      throw new Error('WalletUnified not initialized');
    }

    if (!this.authService.isAuthenticated()) {
      throw new Error('User not authenticated');
    }

    try {
      const { fromWalletId, toAddress, amount, type } = txData;
      
      const wallet = this.getWallet(fromWalletId);
      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Check sufficient balance
      if (wallet.balance < amount) {
        throw new Error('Insufficient balance');
      }

      const transaction = {
        id: this._generateTransactionId(),
        fromWalletId: fromWalletId,
        fromAddress: wallet.address,
        toAddress: toAddress,
        amount: amount,
        type: type || 'transfer',
        status: 'pending',
        createdAt: Date.now(),
        hash: null
      };

      // In production, this would interact with blockchain
      // For now, simulate transaction
      transaction.status = 'confirmed';
      transaction.hash = this._generateTransactionHash();
      transaction.confirmedAt = Date.now();

      // Update balance
      wallet.balance -= amount;
      this._saveToStorage();

      console.log(`[WalletUnified] Transaction created: ${transaction.id}`);
      return transaction;
    } catch (error) {
      console.error('[WalletUnified] Transaction failed:', error);
      throw error;
    }
  }

  /**
   * Generate wallet ID
   * @private
   */
  _generateWalletId() {
    return `wal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate wallet address
   * @private
   */
  _generateAddress(type = 'ethereum') {
    // Generate a mock address based on type
    const prefix = type === 'ethereum' ? '0x' : '';
    const addr = Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    return prefix + addr;
  }

  /**
   * Generate transaction ID
   * @private
   */
  _generateTransactionId() {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate transaction hash
   * @private
   */
  _generateTransactionHash() {
    return '0x' + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  /**
   * Load wallets from storage
   * @private
   */
  _loadFromStorage() {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('pewpi_wallets');
        return stored ? JSON.parse(stored) : null;
      }
    } catch (error) {
      console.warn('[WalletUnified] Failed to load from storage:', error);
    }
    return null;
  }

  /**
   * Save wallets to storage
   * @private
   */
  _saveToStorage() {
    try {
      if (typeof localStorage !== 'undefined') {
        const data = {
          wallets: Object.fromEntries(this.wallets),
          defaultWallet: this.defaultWallet,
          updatedAt: Date.now()
        };
        localStorage.setItem('pewpi_wallets', JSON.stringify(data));
      }
    } catch (error) {
      console.warn('[WalletUnified] Failed to save to storage:', error);
    }
  }
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WalletUnified;
}
if (typeof window !== 'undefined') {
  window.WalletUnified = WalletUnified;
}
