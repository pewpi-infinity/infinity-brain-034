/**
 * Machines Adapter
 * Adapter layer for integrating with various machine states and external systems
 * Provides a unified interface for state machine operations
 */

class MachinesAdapter {
  constructor() {
    this.machines = new Map();
    this.adapters = new Map();
    this.initialized = false;
  }

  /**
   * Initialize the machines adapter
   */
  async init() {
    if (this.initialized) {
      console.log('[MachinesAdapter] Already initialized');
      return;
    }

    try {
      // Set initialized first so _registerDefaultAdapters can work
      this.initialized = true;
      
      // Register default adapters
      this._registerDefaultAdapters();
      
      console.log('[MachinesAdapter] Initialized successfully');
    } catch (error) {
      this.initialized = false;
      console.error('[MachinesAdapter] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Register a state machine
   * @param {string} machineId - Machine identifier
   * @param {object} config - Machine configuration
   * @returns {object} Registered machine
   */
  registerMachine(machineId, config) {
    if (!this.initialized) {
      throw new Error('MachinesAdapter not initialized');
    }

    const machine = {
      id: machineId,
      type: config.type || 'generic',
      state: config.initialState || 'idle',
      states: config.states || {},
      transitions: config.transitions || {},
      context: config.context || {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.machines.set(machineId, machine);
    console.log(`[MachinesAdapter] Registered machine: ${machineId}`);
    
    return machine;
  }

  /**
   * Get a machine by ID
   * @param {string} machineId - Machine identifier
   * @returns {object|null} Machine or null
   */
  getMachine(machineId) {
    if (!this.initialized) {
      throw new Error('MachinesAdapter not initialized');
    }

    return this.machines.get(machineId) || null;
  }

  /**
   * Transition a machine to a new state
   * @param {string} machineId - Machine identifier
   * @param {string} event - Transition event
   * @param {object} payload - Event payload
   * @returns {object} Transition result
   */
  transition(machineId, event, payload = {}) {
    if (!this.initialized) {
      throw new Error('MachinesAdapter not initialized');
    }

    const machine = this.machines.get(machineId);
    if (!machine) {
      throw new Error(`Machine not found: ${machineId}`);
    }

    const currentState = machine.state;
    const transitions = machine.transitions[currentState] || {};
    
    if (!transitions[event]) {
      console.warn(`[MachinesAdapter] No transition for '${event}' from '${currentState}'`);
      return {
        success: false,
        from: currentState,
        to: currentState,
        event: event
      };
    }

    const nextState = transitions[event];
    
    // Execute transition
    machine.state = nextState;
    machine.updatedAt = Date.now();
    
    // Update context with payload
    if (payload) {
      machine.context = { ...machine.context, ...payload };
    }

    console.log(`[MachinesAdapter] Transition: ${machineId} ${currentState} -> ${nextState} (${event})`);
    
    return {
      success: true,
      from: currentState,
      to: nextState,
      event: event,
      context: machine.context
    };
  }

  /**
   * Register an adapter for external system integration
   * @param {string} adapterType - Type of adapter
   * @param {object} adapter - Adapter implementation
   */
  registerAdapter(adapterType, adapter) {
    if (!this.initialized) {
      throw new Error('MachinesAdapter not initialized');
    }

    if (!adapter.connect || !adapter.send || !adapter.receive) {
      throw new Error('Adapter must implement connect, send, and receive methods');
    }

    this.adapters.set(adapterType, adapter);
    console.log(`[MachinesAdapter] Registered adapter: ${adapterType}`);
  }

  /**
   * Get an adapter by type
   * @param {string} adapterType - Type of adapter
   * @returns {object|null} Adapter or null
   */
  getAdapter(adapterType) {
    if (!this.initialized) {
      throw new Error('MachinesAdapter not initialized');
    }

    return this.adapters.get(adapterType) || null;
  }

  /**
   * Connect to an external system via adapter
   * @param {string} adapterType - Type of adapter
   * @param {object} config - Connection configuration
   * @returns {Promise<boolean>} Connection result
   */
  async connect(adapterType, config = {}) {
    if (!this.initialized) {
      throw new Error('MachinesAdapter not initialized');
    }

    const adapter = this.adapters.get(adapterType);
    if (!adapter) {
      throw new Error(`Adapter not found: ${adapterType}`);
    }

    try {
      await adapter.connect(config);
      console.log(`[MachinesAdapter] Connected via adapter: ${adapterType}`);
      return true;
    } catch (error) {
      console.error(`[MachinesAdapter] Connection failed for ${adapterType}:`, error);
      throw error;
    }
  }

  /**
   * Send data via adapter
   * @param {string} adapterType - Type of adapter
   * @param {object} data - Data to send
   * @returns {Promise<object>} Send result
   */
  async send(adapterType, data) {
    if (!this.initialized) {
      throw new Error('MachinesAdapter not initialized');
    }

    const adapter = this.adapters.get(adapterType);
    if (!adapter) {
      throw new Error(`Adapter not found: ${adapterType}`);
    }

    try {
      const result = await adapter.send(data);
      console.log(`[MachinesAdapter] Sent data via ${adapterType}`);
      return result;
    } catch (error) {
      console.error(`[MachinesAdapter] Send failed for ${adapterType}:`, error);
      throw error;
    }
  }

  /**
   * Receive data via adapter
   * @param {string} adapterType - Type of adapter
   * @returns {Promise<object>} Received data
   */
  async receive(adapterType) {
    if (!this.initialized) {
      throw new Error('MachinesAdapter not initialized');
    }

    const adapter = this.adapters.get(adapterType);
    if (!adapter) {
      throw new Error(`Adapter not found: ${adapterType}`);
    }

    try {
      const data = await adapter.receive();
      console.log(`[MachinesAdapter] Received data via ${adapterType}`);
      return data;
    } catch (error) {
      console.error(`[MachinesAdapter] Receive failed for ${adapterType}:`, error);
      throw error;
    }
  }

  /**
   * Get all registered machines
   * @returns {Array} Array of machines
   */
  getAllMachines() {
    if (!this.initialized) {
      throw new Error('MachinesAdapter not initialized');
    }

    return Array.from(this.machines.values());
  }

  /**
   * Get all registered adapters
   * @returns {Array} Array of adapter types
   */
  getAllAdapters() {
    if (!this.initialized) {
      throw new Error('MachinesAdapter not initialized');
    }

    return Array.from(this.adapters.keys());
  }

  /**
   * Register default adapters
   * @private
   */
  _registerDefaultAdapters() {
    // HTTP Adapter
    const httpAdapter = {
      connected: false,
      baseUrl: '',
      
      async connect(config) {
        this.baseUrl = config.baseUrl || '';
        this.connected = true;
      },
      
      async send(data) {
        if (typeof fetch !== 'undefined') {
          const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          return await response.json();
        }
        return { success: true, data };
      },
      
      async receive() {
        if (typeof fetch !== 'undefined') {
          const response = await fetch(this.baseUrl);
          return await response.json();
        }
        return null;
      }
    };

    // WebSocket Adapter
    const wsAdapter = {
      ws: null,
      connected: false,
      
      async connect(config) {
        // Simulated WebSocket connection
        this.connected = true;
      },
      
      async send(data) {
        // Simulated send
        return { success: true, sent: data };
      },
      
      async receive() {
        // Simulated receive
        return null;
      }
    };

    this.registerAdapter('http', httpAdapter);
    this.registerAdapter('websocket', wsAdapter);
  }
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MachinesAdapter;
}
if (typeof window !== 'undefined') {
  window.MachinesAdapter = MachinesAdapter;
}
