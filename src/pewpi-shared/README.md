# pewpi-shared

Unified authentication, wallet, and token management library for the pewpi-infinity distributed brain network.

## Features

- 🔐 **Token Service** - Secure token generation, validation, and lifecycle management
- 👤 **Auth Service** - User authentication and session management with role-based authorization
- 💰 **Wallet Unified** - Multi-wallet support with transaction management
- 📡 **Integration Listener** - Event-driven architecture for cross-service communication
- 🤖 **Machines Adapter** - State machine integration with external systems
- 🎨 **UI Shim** - Defensive UI helpers for safe DOM manipulation

## Installation

This library is included as part of the infinity-brain-034 repository. No separate installation is required.

### Dependencies

```json
{
  "dexie": "^3.2.4",
  "crypto-js": "^4.2.0"
}
```

Install dependencies with:
```bash
npm install
```

## Quick Start

```javascript
// Load the index-shim to initialize all services
<script src="index-shim.js"></script>

// Services are now available globally
const { tokenService, authService, walletService } = window.pewpiShared;

// Authenticate a user
const { user, token } = await authService.authenticate({
  username: 'agent007',
  role: 'user'
});

// Create a wallet
const wallet = await walletService.createWallet({
  type: 'ethereum',
  name: 'Primary Wallet'
});

// Generate a token
const apiToken = tokenService.generate('api', {
  scope: 'read:data',
  expiresAt: Date.now() + 3600000
});
```

## Architecture

```
src/pewpi-shared/
├── token-service.js          # Token management
├── auth-service.js           # Authentication & authorization
├── wallet-unified.js         # Wallet operations
├── integration-listener.js   # Event system
├── machines/
│   └── adapter.js           # State machines & adapters
├── ui/
│   └── ui-shim.js          # UI helpers
├── INTEGRATION.md           # Integration guide
└── README.md               # This file
```

## Core Services

### TokenService

Manages token generation, validation, and storage.

```javascript
const tokenService = new TokenService();
await tokenService.init();

const token = tokenService.generate('session', { userId: 'usr_123' });
const isValid = tokenService.validate(token.id);
```

### AuthService

Handles authentication and authorization.

```javascript
const authService = new AuthService(tokenService);
await authService.init();

await authService.authenticate({ username: 'user' });
const isAuth = authService.isAuthenticated();
```

### WalletUnified

Unified wallet management system.

```javascript
const walletService = new WalletUnified(authService);
await walletService.init();

const wallet = await walletService.createWallet({ type: 'ethereum' });
const tx = await walletService.createTransaction({
  fromWalletId: wallet.id,
  toAddress: '0x...',
  amount: 1.5
});
```

### IntegrationListener

Event-driven integration system.

```javascript
const listener = new IntegrationListener();
await listener.init();

listener.on('wallet:transaction', async (event) => {
  console.log('Transaction:', event.data);
});

await listener.emit('wallet:transaction', { amount: 1.5 });
```

### MachinesAdapter

State machine and external system adapter.

```javascript
const adapter = new MachinesAdapter();
await adapter.init();

adapter.registerMachine('flow', {
  initialState: 'idle',
  transitions: {
    idle: { start: 'processing' }
  }
});

adapter.transition('flow', 'start');
```

### UIShim

Safe UI manipulation helpers.

```javascript
const ui = new UIShim();
await ui.init();

ui.toast('Success!', { type: 'success' });
const element = ui.query('#my-element');
```

## Defensive Initialization

All services use defensive initialization to ensure they're properly set up before use:

```javascript
// Correct order with dependency injection
const tokenService = new TokenService();
await tokenService.init();

const authService = new AuthService(tokenService);
await authService.init();

const walletService = new WalletUnified(authService);
await walletService.init();

const listener = new IntegrationListener();
await listener.init();
```

Services will throw errors if used before initialization or if dependencies are missing.

## Integration

Use the provided `index-shim.js` loader for automatic, defensive initialization:

```html
<script src="index-shim.js"></script>
<script>
  // Wait for initialization
  window.pewpiShared.ready.then(() => {
    const { authService } = window.pewpiShared;
    // Use services...
  });
</script>
```

## Event System

Standard events for cross-service communication:

- `auth:login` - User authenticated
- `auth:logout` - User logged out
- `wallet:created` - New wallet created
- `wallet:transaction` - Transaction processed
- `token:generated` - Token created
- `token:revoked` - Token revoked
- `machine:transition` - State machine transition

## Security

⚠️ **Important Security Notes:**

- Current implementation uses localStorage for session storage
- Token values are base64-encoded but not encrypted
- Wallet operations are mocked and not connected to real blockchains
- For production use, implement proper encryption, secure storage, and blockchain integration

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Requires ES6+ support

## Node.js Support

Services can run in Node.js with appropriate shims:
- Use `node-localstorage` for localStorage
- Use `jsdom` for DOM-dependent features
- Use `node-fetch` for fetch API

## Documentation

- [INTEGRATION.md](./INTEGRATION.md) - Comprehensive integration guide
- API documentation available inline in source files

## Development

### Running Tests

```bash
npm test
```

### Building

No build step required. This is a native ES6 library.

### Linting

```bash
npm run lint
```

## Contributing

This library is part of the infinity-brain-034 repository. Follow the repository's contribution guidelines.

## License

ISC License - See repository root for details

## Version

1.0.0 - Initial release

## Authors

pewpi-infinity team

---

**Part of the pewpi-infinity distributed brain network (007 Edition)**
