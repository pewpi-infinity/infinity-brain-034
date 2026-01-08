/**
 * Integration Listener
 * Listens for and handles integration events across the pewpi-infinity system
 * Provides event-driven communication between services
 */

class IntegrationListener {
  constructor() {
    this.listeners = new Map();
    this.eventQueue = [];
    this.initialized = false;
    this.maxQueueSize = 1000;
  }

  /**
   * Initialize the integration listener
   */
  async init() {
    if (this.initialized) {
      console.log('[IntegrationListener] Already initialized');
      return;
    }

    try {
      this.initialized = true;
      console.log('[IntegrationListener] Initialized successfully');
    } catch (error) {
      console.error('[IntegrationListener] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Register an event listener
   * @param {string} eventType - Type of event to listen for
   * @param {Function} handler - Handler function
   * @param {object} options - Listener options
   * @returns {string} Listener ID
   */
  on(eventType, handler, options = {}) {
    if (!this.initialized) {
      throw new Error('IntegrationListener not initialized');
    }

    if (typeof handler !== 'function') {
      throw new Error('Handler must be a function');
    }

    const listenerId = this._generateListenerId();
    
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Map());
    }

    const listener = {
      id: listenerId,
      handler: handler,
      once: options.once || false,
      priority: options.priority || 0,
      createdAt: Date.now()
    };

    this.listeners.get(eventType).set(listenerId, listener);
    
    console.log(`[IntegrationListener] Registered listener for '${eventType}': ${listenerId}`);
    return listenerId;
  }

  /**
   * Register a one-time event listener
   * @param {string} eventType - Type of event to listen for
   * @param {Function} handler - Handler function
   * @returns {string} Listener ID
   */
  once(eventType, handler) {
    return this.on(eventType, handler, { once: true });
  }

  /**
   * Remove an event listener
   * @param {string} eventType - Type of event
   * @param {string} listenerId - Listener ID to remove
   * @returns {boolean} True if removed
   */
  off(eventType, listenerId) {
    if (!this.initialized) {
      throw new Error('IntegrationListener not initialized');
    }

    const listeners = this.listeners.get(eventType);
    if (listeners) {
      const removed = listeners.delete(listenerId);
      if (removed) {
        console.log(`[IntegrationListener] Removed listener: ${listenerId}`);
      }
      return removed;
    }

    return false;
  }

  /**
   * Remove all listeners for an event type
   * @param {string} eventType - Type of event
   */
  removeAllListeners(eventType) {
    if (!this.initialized) {
      throw new Error('IntegrationListener not initialized');
    }

    if (eventType) {
      this.listeners.delete(eventType);
      console.log(`[IntegrationListener] Removed all listeners for '${eventType}'`);
    } else {
      this.listeners.clear();
      console.log('[IntegrationListener] Removed all listeners');
    }
  }

  /**
   * Emit an event
   * @param {string} eventType - Type of event to emit
   * @param {object} data - Event data
   * @returns {number} Number of listeners notified
   */
  async emit(eventType, data = {}) {
    if (!this.initialized) {
      throw new Error('IntegrationListener not initialized');
    }

    const event = {
      type: eventType,
      data: data,
      timestamp: Date.now(),
      id: this._generateEventId()
    };

    // Add to queue
    this._addToQueue(event);

    const listeners = this.listeners.get(eventType);
    if (!listeners || listeners.size === 0) {
      console.log(`[IntegrationListener] No listeners for '${eventType}'`);
      return 0;
    }

    // Sort listeners by priority
    const sortedListeners = Array.from(listeners.values())
      .sort((a, b) => b.priority - a.priority);

    let notified = 0;
    const toRemove = [];

    for (const listener of sortedListeners) {
      try {
        await listener.handler(event);
        notified++;

        if (listener.once) {
          toRemove.push(listener.id);
        }
      } catch (error) {
        console.error(`[IntegrationListener] Error in listener ${listener.id}:`, error);
      }
    }

    // Remove one-time listeners
    for (const listenerId of toRemove) {
      listeners.delete(listenerId);
    }

    console.log(`[IntegrationListener] Emitted '${eventType}' to ${notified} listeners`);
    return notified;
  }

  /**
   * Get all registered event types
   * @returns {Array} Array of event types
   */
  getEventTypes() {
    if (!this.initialized) {
      throw new Error('IntegrationListener not initialized');
    }

    return Array.from(this.listeners.keys());
  }

  /**
   * Get listener count for an event type
   * @param {string} eventType - Type of event
   * @returns {number} Number of listeners
   */
  listenerCount(eventType) {
    if (!this.initialized) {
      throw new Error('IntegrationListener not initialized');
    }

    const listeners = this.listeners.get(eventType);
    return listeners ? listeners.size : 0;
  }

  /**
   * Get recent events from queue
   * @param {number} limit - Maximum number of events to return
   * @returns {Array} Array of recent events
   */
  getRecentEvents(limit = 10) {
    if (!this.initialized) {
      throw new Error('IntegrationListener not initialized');
    }

    return this.eventQueue.slice(-limit);
  }

  /**
   * Clear event queue
   */
  clearQueue() {
    if (!this.initialized) {
      throw new Error('IntegrationListener not initialized');
    }

    this.eventQueue = [];
    console.log('[IntegrationListener] Event queue cleared');
  }

  /**
   * Generate listener ID
   * @private
   */
  _generateListenerId() {
    return `lst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate event ID
   * @private
   */
  _generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add event to queue
   * @private
   */
  _addToQueue(event) {
    this.eventQueue.push(event);
    
    // Maintain max queue size
    if (this.eventQueue.length > this.maxQueueSize) {
      this.eventQueue.shift();
    }
  }
}

// Export for both CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IntegrationListener;
}
if (typeof window !== 'undefined') {
  window.IntegrationListener = IntegrationListener;
}
