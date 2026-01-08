#!/usr/bin/env node

/**
 * Simple test script for pewpi-shared library
 * Tests basic functionality of all services
 */

// Mock localStorage for Node.js environment
global.localStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  },
  removeItem(key) {
    delete this.data[key];
  },
  clear() {
    this.data = {};
  }
};

// Load services
const TokenService = require('./src/pewpi-shared/token-service.js');
const AuthService = require('./src/pewpi-shared/auth-service.js');
const WalletUnified = require('./src/pewpi-shared/wallet-unified.js');
const IntegrationListener = require('./src/pewpi-shared/integration-listener.js');
const MachinesAdapter = require('./src/pewpi-shared/machines/adapter.js');

async function runTests() {
  console.log('🧪 Testing pewpi-shared library\n');
  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: TokenService
  try {
    console.log('📝 Test 1: TokenService');
    const tokenService = new TokenService();
    await tokenService.init();
    
    const token = tokenService.generate('test', { purpose: 'testing' });
    console.log('  ✓ Token generated:', token.id);
    
    const isValid = tokenService.validate(token.id);
    if (!isValid) throw new Error('Token validation failed');
    console.log('  ✓ Token validated');
    
    tokenService.revoke(token.id);
    const isStillValid = tokenService.validate(token.id);
    if (isStillValid) throw new Error('Token should be invalid after revocation');
    console.log('  ✓ Token revoked');
    
    testsPassed++;
    console.log('✅ TokenService tests passed\n');
  } catch (error) {
    testsFailed++;
    console.error('❌ TokenService tests failed:', error.message, '\n');
  }

  // Test 2: AuthService
  try {
    console.log('📝 Test 2: AuthService');
    const tokenService = new TokenService();
    await tokenService.init();
    
    const authService = new AuthService(tokenService);
    await authService.init();
    
    const { user, token } = await authService.authenticate({
      username: 'testuser',
      role: 'user'
    });
    console.log('  ✓ User authenticated:', user.username);
    
    const isAuth = authService.isAuthenticated();
    if (!isAuth) throw new Error('User should be authenticated');
    console.log('  ✓ Authentication status verified');
    
    const currentUser = authService.getCurrentUser();
    if (!currentUser || currentUser.username !== 'testuser') {
      throw new Error('Current user mismatch');
    }
    console.log('  ✓ Current user retrieved');
    
    const canWrite = authService.authorize('write');
    if (!canWrite) throw new Error('User should be able to write');
    console.log('  ✓ Authorization verified');
    
    await authService.logout();
    const isStillAuth = authService.isAuthenticated();
    if (isStillAuth) throw new Error('User should not be authenticated after logout');
    console.log('  ✓ Logout successful');
    
    testsPassed++;
    console.log('✅ AuthService tests passed\n');
  } catch (error) {
    testsFailed++;
    console.error('❌ AuthService tests failed:', error.message, '\n');
  }

  // Test 3: WalletUnified
  try {
    console.log('📝 Test 3: WalletUnified');
    const tokenService = new TokenService();
    await tokenService.init();
    
    const authService = new AuthService(tokenService);
    await authService.init();
    await authService.authenticate({ username: 'testuser' });
    
    const walletService = new WalletUnified(authService);
    await walletService.init();
    
    const wallet = await walletService.createWallet({
      type: 'ethereum',
      name: 'Test Wallet'
    });
    console.log('  ✓ Wallet created:', wallet.id);
    
    const userWallets = walletService.getUserWallets();
    if (userWallets.length !== 1) throw new Error('Should have 1 wallet');
    console.log('  ✓ User wallets retrieved:', userWallets.length);
    
    const defaultWallet = walletService.getDefaultWallet();
    if (!defaultWallet) throw new Error('Default wallet should be set');
    console.log('  ✓ Default wallet retrieved');
    
    walletService.updateBalance(wallet.id, 10);
    const tx = await walletService.createTransaction({
      fromWalletId: wallet.id,
      toAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      amount: 1.5
    });
    console.log('  ✓ Transaction created:', tx.id);
    
    testsPassed++;
    console.log('✅ WalletUnified tests passed\n');
  } catch (error) {
    testsFailed++;
    console.error('❌ WalletUnified tests failed:', error.message, '\n');
  }

  // Test 4: IntegrationListener
  try {
    console.log('📝 Test 4: IntegrationListener');
    const listener = new IntegrationListener();
    await listener.init();
    
    let eventReceived = false;
    const listenerId = listener.on('test:event', async (event) => {
      eventReceived = true;
      console.log('  ✓ Event received:', event.type);
    });
    
    await listener.emit('test:event', { message: 'Hello' });
    if (!eventReceived) throw new Error('Event not received');
    
    const count = listener.listenerCount('test:event');
    if (count !== 1) throw new Error('Listener count mismatch');
    console.log('  ✓ Listener count:', count);
    
    listener.off('test:event', listenerId);
    const newCount = listener.listenerCount('test:event');
    if (newCount !== 0) throw new Error('Listener should be removed');
    console.log('  ✓ Listener removed');
    
    const recentEvents = listener.getRecentEvents(5);
    console.log('  ✓ Recent events retrieved:', recentEvents.length);
    
    testsPassed++;
    console.log('✅ IntegrationListener tests passed\n');
  } catch (error) {
    testsFailed++;
    console.error('❌ IntegrationListener tests failed:', error.message, '\n');
  }

  // Test 5: MachinesAdapter
  try {
    console.log('📝 Test 5: MachinesAdapter');
    const adapter = new MachinesAdapter();
    await adapter.init();
    
    const machine = adapter.registerMachine('test-flow', {
      initialState: 'idle',
      transitions: {
        idle: { start: 'processing' },
        processing: { complete: 'done' }
      }
    });
    console.log('  ✓ Machine registered:', machine.id);
    
    const result1 = adapter.transition('test-flow', 'start');
    if (!result1.success || result1.to !== 'processing') {
      throw new Error('Transition failed');
    }
    console.log('  ✓ Transition 1:', result1.from, '->', result1.to);
    
    const result2 = adapter.transition('test-flow', 'complete');
    if (!result2.success || result2.to !== 'done') {
      throw new Error('Transition failed');
    }
    console.log('  ✓ Transition 2:', result2.from, '->', result2.to);
    
    const retrievedMachine = adapter.getMachine('test-flow');
    if (!retrievedMachine || retrievedMachine.state !== 'done') {
      throw new Error('Machine state mismatch');
    }
    console.log('  ✓ Machine state verified:', retrievedMachine.state);
    
    testsPassed++;
    console.log('✅ MachinesAdapter tests passed\n');
  } catch (error) {
    testsFailed++;
    console.error('❌ MachinesAdapter tests failed:', error.message, '\n');
  }

  // Summary
  console.log('═══════════════════════════════════');
  console.log(`Tests Passed: ${testsPassed}`);
  console.log(`Tests Failed: ${testsFailed}`);
  console.log('═══════════════════════════════════');

  if (testsFailed > 0) {
    console.log('\n❌ Some tests failed');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
