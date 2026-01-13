/**
 * pewpi-shared Index Shim
 * Defensive loader and initializer for the pewpi-shared library
 * Provides safe initialization with error handling and fallbacks
 */

(function(global) {
  'use strict';

  // Defensive check for environment
  const isBrowser = typeof window !== 'undefined';
  const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;

  // Logger with fallback
  const log = {
    info: (...args) => console.log('[pewpi-shared]', ...args),
    warn: (...args) => console.warn('[pewpi-shared]', ...args),
    error: (...args) => console.error('[pewpi-shared]', ...args)
  };

  // Service loader with error handling
  async function loadServices() {
    const services = {};
    const errors = [];

    try {
      log.info('Initializing pewpi-shared library...');

      // Step 1: Load TokenService
      try {
        if (isBrowser && typeof window.TokenService !== 'undefined') {
          services.TokenService = window.TokenService;
        } else if (isNode) {
          services.TokenService = require('./src/pewpi-shared/token-service.js');
        }

        if (services.TokenService) {
          services.tokenService = new services.TokenService();
          await services.tokenService.init();
          log.info('✓ TokenService initialized');
        } else {
          throw new Error('TokenService not found');
        }
      } catch (error) {
        errors.push({ service: 'TokenService', error });
        log.error('✗ TokenService initialization failed:', error.message);
      }

      // Step 2: Load AuthService (depends on TokenService)
      try {
        if (!services.tokenService) {
          throw new Error('TokenService not available');
        }

        if (isBrowser && typeof window.AuthService !== 'undefined') {
          services.AuthService = window.AuthService;
        } else if (isNode) {
          services.AuthService = require('./src/pewpi-shared/auth-service.js');
        }

        if (services.AuthService) {
          services.authService = new services.AuthService(services.tokenService);
          await services.authService.init();
          log.info('✓ AuthService initialized');
        } else {
          throw new Error('AuthService not found');
        }
      } catch (error) {
        errors.push({ service: 'AuthService', error });
        log.error('✗ AuthService initialization failed:', error.message);
      }

      // Step 3: Load WalletUnified (depends on AuthService)
      try {
        if (!services.authService) {
          throw new Error('AuthService not available');
        }

        if (isBrowser && typeof window.WalletUnified !== 'undefined') {
          services.WalletUnified = window.WalletUnified;
        } else if (isNode) {
          services.WalletUnified = require('./src/pewpi-shared/wallet-unified.js');
        }

        if (services.WalletUnified) {
          services.walletService = new services.WalletUnified(services.authService);
          await services.walletService.init();
          log.info('✓ WalletUnified initialized');
        } else {
          throw new Error('WalletUnified not found');
        }
      } catch (error) {
        errors.push({ service: 'WalletUnified', error });
        log.error('✗ WalletUnified initialization failed:', error.message);
      }

      // Step 4: Load IntegrationListener
      try {
        if (isBrowser && typeof window.IntegrationListener !== 'undefined') {
          services.IntegrationListener = window.IntegrationListener;
        } else if (isNode) {
          services.IntegrationListener = require('./src/pewpi-shared/integration-listener.js');
        }

        if (services.IntegrationListener) {
          services.integrationListener = new services.IntegrationListener();
          await services.integrationListener.init();
          log.info('✓ IntegrationListener initialized');
        } else {
          throw new Error('IntegrationListener not found');
        }
      } catch (error) {
        errors.push({ service: 'IntegrationListener', error });
        log.error('✗ IntegrationListener initialization failed:', error.message);
      }

      // Step 5: Load MachinesAdapter
      try {
        if (isBrowser && typeof window.MachinesAdapter !== 'undefined') {
          services.MachinesAdapter = window.MachinesAdapter;
        } else if (isNode) {
          services.MachinesAdapter = require('./src/pewpi-shared/machines/adapter.js');
        }

        if (services.MachinesAdapter) {
          services.machinesAdapter = new services.MachinesAdapter();
          await services.machinesAdapter.init();
          log.info('✓ MachinesAdapter initialized');
        } else {
          throw new Error('MachinesAdapter not found');
        }
      } catch (error) {
        errors.push({ service: 'MachinesAdapter', error });
        log.error('✗ MachinesAdapter initialization failed:', error.message);
      }

      // Step 6: Load UIShim (browser only)
      if (isBrowser) {
        try {
          if (typeof window.UIShim !== 'undefined') {
            services.UIShim = window.UIShim;
            services.uiShim = new services.UIShim();
            await services.uiShim.init();
            log.info('✓ UIShim initialized');
          } else {
            throw new Error('UIShim not found');
          }
        } catch (error) {
          errors.push({ service: 'UIShim', error });
          log.error('✗ UIShim initialization failed:', error.message);
        }
      }

      // Step 7: Wire up integration events
      if (services.integrationListener) {
        try {
          wireIntegrationEvents(services);
          log.info('✓ Integration events wired');
        } catch (error) {
          errors.push({ service: 'Integration Events', error });
          log.error('✗ Integration events wiring failed:', error.message);
        }
      }

      // Summary
      const initialized = Object.keys(services).filter(k => k.endsWith('Service') || k.endsWith('Adapter') || k.endsWith('Shim')).length;
      log.info(`Initialization complete: ${initialized} services initialized, ${errors.length} errors`);

      return { services, errors };
    } catch (error) {
      log.error('Fatal initialization error:', error);
      return { services: {}, errors: [{ service: 'Global', error }] };
    }
  }

  // Wire up integration events between services
  function wireIntegrationEvents(services) {
    const { integrationListener, authService, walletService, tokenService } = services;

    if (!integrationListener) return;

    // Auth events
    if (authService) {
      // Listen for auth events and emit integration events
      const originalAuthenticate = authService.authenticate.bind(authService);
      authService.authenticate = async function(...args) {
        const result = await originalAuthenticate(...args);
        await integrationListener.emit('auth:login', {
          user: result.user,
          token: result.token
        });
        return result;
      };

      const originalLogout = authService.logout.bind(authService);
      authService.logout = async function(...args) {
        const user = authService.getCurrentUser();
        await originalLogout(...args);
        await integrationListener.emit('auth:logout', {
          userId: user ? user.id : null
        });
      };
    }

    // Wallet events
    if (walletService) {
      const originalCreateWallet = walletService.createWallet.bind(walletService);
      walletService.createWallet = async function(...args) {
        const wallet = await originalCreateWallet(...args);
        await integrationListener.emit('wallet:created', { wallet });
        return wallet;
      };

      const originalCreateTransaction = walletService.createTransaction.bind(walletService);
      walletService.createTransaction = async function(...args) {
        const transaction = await originalCreateTransaction(...args);
        await integrationListener.emit('wallet:transaction', {
          transaction,
          walletId: transaction.fromWalletId
        });
        return transaction;
      };
    }

    // Token events
    if (tokenService) {
      const originalGenerate = tokenService.generate.bind(tokenService);
      tokenService.generate = function(...args) {
        const token = originalGenerate(...args);
        integrationListener.emit('token:generated', { token });
        return token;
      };

      const originalRevoke = tokenService.revoke.bind(tokenService);
      tokenService.revoke = function(...args) {
        const result = originalRevoke(...args);
        if (result) {
          integrationListener.emit('token:revoked', { tokenId: args[0] });
        }
        return result;
      };
    }
  }

  // Create global namespace
  const pewpiShared = {
    version: '1.0.0',
    initialized: false,
    ready: null,
    services: null,
    errors: null
  };

  // Initialize and expose
  pewpiShared.ready = loadServices().then(({ services, errors }) => {
    pewpiShared.services = services;
    pewpiShared.errors = errors;
    pewpiShared.initialized = true;

    // Expose services for easy access
    Object.assign(pewpiShared, services);

    return pewpiShared;
  }).catch(error => {
    log.error('Failed to initialize pewpi-shared:', error);
    pewpiShared.errors = [{ service: 'Initialization', error }];
    return pewpiShared;
  });

  // Export to global namespace
  if (isBrowser) {
    global.pewpiShared = pewpiShared;
    log.info('pewpi-shared loader ready. Access via window.pewpiShared');
  }

  if (isNode && typeof module !== 'undefined' && module.exports) {
    module.exports = pewpiShared;
  }

})(typeof window !== 'undefined' ? window : global);
