/**
 * Domain Layer
 *
 * This layer contains the core business logic and entities that define "what Wishy is."
 *
 * Structure:
 * - wishes/     : Wish entity and state machine
 * - connections/: Connections, requests, and social graph
 * - visibility/ : Permission and visibility rules
 * - shared/     : Domain errors and events
 *
 * Key principle: No dependencies on React, Zustand, or Supabase
 * This layer should be framework-agnostic and testable in isolation.
 */

export * from "./wishes";
export * from "./connections";
export * from "./visibility";
export * from "./shared";
