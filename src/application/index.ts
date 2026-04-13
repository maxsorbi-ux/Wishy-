/**
 * Application Layer
 *
 * Use cases that orchestrate domain logic and repositories.
 * No React or UI dependencies here.
 *
 * Export structure:
 * - wishes/     : Wish-related use cases
 * - connections/: Connection-related use cases
 * - shared/     : Repository interfaces and shared types
 */

export * from "./wishes";
export * from "./connections";
export * from "./shared";
