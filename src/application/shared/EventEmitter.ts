/**
 * Event emitter interface
 *
 * Use cases emit domain events, which drive notifications, analytics, and UI updates.
 */

import { AllDomainEvents } from "../../domain";

export interface IEventEmitter {
  emit(event: AllDomainEvents): void;
  on(eventType: string, handler: (event: AllDomainEvents) => void): void;
  off(eventType: string, handler: (event: AllDomainEvents) => void): void;
}
