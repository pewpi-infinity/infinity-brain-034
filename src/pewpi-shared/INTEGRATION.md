# pewpi-shared Integration Guide

This document provides comprehensive guidance for integrating the pewpi-shared library into your pewpi-infinity brain node.

## Overview

The pewpi-shared library provides a unified set of services for authentication, token management, wallet operations, event handling, and state machine integration across the pewpi-infinity distributed brain network.

## Architecture

```
pewpi-shared/
├── token-service.js       # Token generation and validation
├── auth-service.js        # Authentication and authorization
├── wallet-unified.js      # Unified wallet management
├── integration-listener.js # Event-driven integration
├── machines/
│   └── adapter.js         # State machine adapter layer
└── ui/
    └── ui-shim.js         # UI helpers and components
```

## Core Services

### TokenService

Manages token lifecycle including generation, validation, and revocation.

**Key Features:**
- Token generation with configurable expiration
- Token validation and cleanup
- Local storage persistence
- Support for multiple token types (auth, session, api)

**Basic Usage:**
```javascript
const tokenService = new TokenService();
await tokenService.init();

// Generate a token
const token = tokenService.generate('session', {
  userId: 'usr_123',
  expiresAt: Date.now() + 3600000
});

// Validate token
const isValid = tokenService.validate(token.id);

// Get token
const retrieved = tokenService.get(token.id);

// Revoke token
tokenService.revoke(token.id);
```

### AuthService

Handles user authentication and session management.

**Key Features:**
- User authentication with session tokens
- Session persistence across page reloads
- Role-based authorization
- Secure logout

**Basic Usage:**
```javascript
const authService = new AuthService(tokenService);
await authService.init();

// Authenticate user
const { user, token } = await authService.authenticate({
  username: 'agent007',
  role: 'user'
});

// Check authentication status
const isAuth = authService.isAuthenticated();

// Get current user
const currentUser = authService.getCurrentUser();

// Authorize action
const canWrite = authService.authorize('write');

// Logout
await authService.logout();
```

### WalletUnified

Unified wallet service for cryptocurrency operations.

**Key Features:**
- Multi-wallet support
- Balance tracking
- Transaction management
- Default wallet configuration

**Basic Usage:**
```javascript
const walletService = new WalletUnified(authService);
await walletService.init();

// Create wallet
const wallet = await walletService.createWallet({
  type: 'ethereum',
  name: 'My Primary Wallet'
});

// Get user wallets
const wallets = walletService.getUserWallets();

// Set default wallet
walletService.setDefaultWallet(wallet.id);

// Create transaction
const tx = await walletService.createTransaction({
  fromWalletId: wallet.id,
  toAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  amount: 1.5,
  type: 'transfer'
});
```

### IntegrationListener

Event-driven integration system for cross-service communication.

**Key Features:**
- Event registration and emission
- Priority-based event handling
- One-time event listeners
- Event queue with history

**Basic Usage:**
```javascript
const listener = new IntegrationListener();
await listener.init();

// Register event listener
const listenerId = listener.on('wallet:transaction', async (event) => {
  console.log('Transaction event:', event.data);
});

// Register one-time listener
listener.once('auth:login', async (event) => {
  console.log('User logged in:', event.data.user);
});

// Emit event
await listener.emit('wallet:transaction', {
  walletId: 'wal_123',
  amount: 1.5
});

// Remove listener
listener.off('wallet:transaction', listenerId);
```

### MachinesAdapter

State machine adapter for external system integration.

**Key Features:**
- State machine registration
- State transitions with event handling
- Adapter pattern for external systems
- Built-in HTTP and WebSocket adapters

**Basic Usage:**
```javascript
const adapter = new MachinesAdapter();
await adapter.init();

// Register a state machine
const machine = adapter.registerMachine('payment-flow', {
  initialState: 'idle',
  states: {
    idle: {},
    processing: {},
    completed: {},
    failed: {}
  },
  transitions: {
    idle: { start: 'processing' },
    processing: { success: 'completed', error: 'failed' },
    failed: { retry: 'processing' }
  }
});

// Transition state
const result = adapter.transition('payment-flow', 'start', {
  amount: 100
});

// Use HTTP adapter
await adapter.connect('http', { baseUrl: 'https://api.example.com' });
const response = await adapter.send('http', { action: 'verify' });
```

### UIShim

Defensive UI helpers for DOM manipulation.

**Key Features:**
- Safe DOM querying
- Element creation with attributes
- Event handling with cleanup
- Toast notifications
- Loading indicators

**Basic Usage:**
```javascript
const ui = new UIShim();
await ui.init();

// Query elements
const element = ui.query('#my-element');
const elements = ui.queryAll('.my-class');

// Create element
const button = ui.create('button', {
  className: 'btn btn-primary',
  onClick: () => console.log('Clicked!')
}, 'Click Me');

// Add event listener
const cleanup = ui.on('#submit', 'click', (e) => {
  console.log('Submit clicked');
});

// Show toast
ui.toast('Operation successful!', {
  type: 'success',
  duration: 3000,
  position: 'bottom-right'
});

// Show loading
const loading = ui.showLoading('Processing...');
// Later: loading.hide();
```

## Initialization Pattern

The pewpi-shared library follows a defensive initialization pattern. All services must be initialized before use:

```javascript
// Initialize in correct order
const tokenService = new TokenService();
await tokenService.init();

const authService = new AuthService(tokenService);
await authService.init();

const walletService = new WalletUnified(authService);
await walletService.init();

const listener = new IntegrationListener();
await listener.init();

const adapter = new MachinesAdapter();
await adapter.init();

const ui = new UIShim();
await ui.init();
```

## Integration Events

The following standard events are recommended for cross-service communication:

| Event Type | Description | Data |
|------------|-------------|------|
| `auth:login` | User logged in | `{ user, token }` |
| `auth:logout` | User logged out | `{ userId }` |
| `wallet:created` | Wallet created | `{ wallet }` |
| `wallet:transaction` | Transaction created | `{ transaction, walletId }` |
| `token:generated` | Token generated | `{ token }` |
| `token:revoked` | Token revoked | `{ tokenId }` |
| `machine:transition` | State machine transitioned | `{ machineId, from, to, event }` |

## Error Handling

All services throw errors for invalid states and operations. Always wrap service calls in try-catch blocks:

```javascript
try {
  const token = tokenService.generate('session', payload);
} catch (error) {
  console.error('Token generation failed:', error);
  // Handle error appropriately
}
```

## Security Considerations

1. **Token Security**: Tokens are stored in localStorage. For production use, consider:
   - Using secure, httpOnly cookies for session tokens
   - Implementing token encryption
   - Setting appropriate expiration times

2. **Authentication**: The current implementation is simplified. For production:
   - Implement proper credential verification
   - Use secure password hashing
   - Implement rate limiting
   - Add 2FA support

3. **Wallet Operations**: Current implementation is mock. For production:
   - Integrate with actual blockchain networks
   - Implement proper key management
   - Use hardware wallet support
   - Add transaction signing

## Browser Compatibility

The library is designed to work in modern browsers with:
- ES6+ support
- localStorage API
- Fetch API (for adapters)
- Promises/async-await

For older browsers, consider using polyfills.

## Node.js Compatibility

All services can run in Node.js environment with appropriate shims for:
- localStorage (use node-localstorage or similar)
- DOM APIs (use jsdom for UI components)

## Best Practices

1. **Initialize Once**: Initialize services once during application startup
2. **Dependency Injection**: Pass dependencies (e.g., tokenService to authService)
3. **Event-Driven**: Use IntegrationListener for loose coupling between services
4. **Error Handling**: Always handle errors from service operations
5. **Cleanup**: Use cleanup functions returned by event listeners
6. **State Machines**: Model complex workflows as state machines
7. **Defensive Coding**: Check initialization status before operations

## Troubleshooting

### Service not initialized
**Error**: `Service not initialized`
**Solution**: Call `await service.init()` before using the service

### Token validation fails
**Error**: Token validation returns false
**Solution**: Check token expiration time and ensure token exists

### Authentication fails
**Error**: `User not authenticated`
**Solution**: Call `authService.authenticate()` before protected operations

### Storage errors
**Error**: Failed to save/load from storage
**Solution**: Check localStorage availability and quota limits

## Examples

See the `/examples` directory for complete integration examples including:
- Basic authentication flow
- Wallet operations
- Event-driven architecture
- State machine workflows
- UI component integration

## Support

For issues, questions, or contributions, please refer to the main repository documentation.
