/**
 * EventEmitter - Simple pub/sub for domain events
 *
 * Allows domain events to be published by use cases
 * and listened to by subscribers (screens, stores, etc.)
 */

import { AllDomainEvents } from "../domain";
import { IEventEmitter } from "../application";

type EventHandler = (event: AllDomainEvents) => void;

export class EventEmitter implements IEventEmitter {
  private listeners: { [key: string]: EventHandler[] } = {};

  /**
   * Subscribe to a specific event type
   *
   * @param eventType - The event type to listen for (e.g., 'WishSent')
   * @param handler - Callback function to execute when event is published
   * @returns Unsubscribe function
   */
  on(eventType: string, handler: EventHandler): () => void {
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = [];
    }

    const handlers = this.listeners[eventType];
    handlers.push(handler);

    // Return unsubscribe function
    return () => {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to all events
   *
   * @param handler - Callback function to execute for any event
   * @returns Unsubscribe function
   */
  onAll(handler: EventHandler): () => void {
    return this.on("*", handler);
  }

  /**
   * Publish a domain event to all subscribers
   *
   * @param event - The domain event to publish
   */
  emit(event: AllDomainEvents): void {
    const eventType = event.type;

    // Notify specific type listeners
    const handlers = this.listeners[eventType] || [];
    for (let i = 0; i < handlers.length; i++) {
      try {
        handlers[i](event);
      } catch (error) {
        console.error(`Error in event handler for ${eventType}:`, error);
      }
    }

    // Notify wildcard listeners
    const allHandlers = this.listeners["*"] || [];
    for (let i = 0; i < allHandlers.length; i++) {
      try {
        allHandlers[i](event);
      } catch (error) {
        console.error(`Error in wildcard event handler:`, error);
      }
    }
  }

  /**
   * Remove all listeners for a specific event type
   */
  off(eventType: string, handler?: (event: AllDomainEvents) => void): void {
    if (handler) {
      // Remove specific handler
      const handlers = this.listeners[eventType] || [];
      const index = handlers.indexOf(handler as EventHandler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    } else {
      // Remove all handlers for this event type
      delete this.listeners[eventType];
    }
  }

  /**
   * Remove all listeners
   */
  clear(): void {
    this.listeners = {};
  }
}
