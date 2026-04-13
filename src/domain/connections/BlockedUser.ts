/**
 * BlockedUser - User blocking record
 *
 * When a user blocks another user, that blocked user cannot:
 * - See the blocker's profile
 * - Send connection requests
 * - Interact with the blocker in any way
 */

export interface BlockedUser {
  id: string;
  blockerId: string; // User who did the blocking
  blockedUserId: string; // User who was blocked
  blockedAt: string; // ISO timestamp
}

/**
 * Check if a user is blocked by another user
 */
export function isUserBlocked(block: BlockedUser, blockerId: string, blockedUserId: string): boolean {
  return block.blockerId === blockerId && block.blockedUserId === blockedUserId;
}

/**
 * Create a new block record
 */
export function createBlockedUser(input: {
  blockerId: string;
  blockedUserId: string;
}): BlockedUser {
  return {
    id: "", // Will be assigned by persistence layer
    blockerId: input.blockerId,
    blockedUserId: input.blockedUserId,
    blockedAt: new Date().toISOString(),
  };
}
