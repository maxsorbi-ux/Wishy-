/**
 * WishRecipient - Explicit modeling of who receives a wish
 *
 * This is separate from Wish because:
 * - Multiple recipients can exist for one wish
 * - Recipient status is independent (one can accept while another rejects)
 * - Recipients have their own state machine
 */

export type RecipientWishStatus =
  | "sent"      // Wish sent, awaiting response
  | "accepted"  // Recipient accepted
  | "rejected"  // Recipient rejected
  | "hidden";   // Recipient hid from their view

export interface WishRecipient {
  id: string;
  wishId: string;
  recipientId: string; // User ID

  // Recipient-specific status
  status: RecipientWishStatus;

  // When did recipient respond?
  respondedAt?: string; // ISO timestamp

  // When was this recipient added?
  addedAt: string; // ISO timestamp
}

/**
 * Allowed transitions for recipient status
 */
export const ALLOWED_RECIPIENT_TRANSITIONS: Record<RecipientWishStatus, RecipientWishStatus[]> = {
  sent: ["accepted", "rejected", "hidden"],
  accepted: ["rejected", "hidden"],
  rejected: ["hidden"],
  hidden: [],
};

/**
 * Check if a recipient status transition is allowed
 */
export function isRecipientTransitionAllowed(
  from: RecipientWishStatus,
  to: RecipientWishStatus
): boolean {
  const allowed = ALLOWED_RECIPIENT_TRANSITIONS[from];
  if (!allowed) return false;
  for (const status of allowed) {
    if (status === to) return true;
  }
  return false;
}

/**
 * Check if recipient has responded to the wish
 */
export function hasRecipientResponded(recipient: WishRecipient): boolean {
  return recipient.status === "accepted" || recipient.status === "rejected";
}

/**
 * Create a new wish recipient record
 */
export function createWishRecipient(input: {
  wishId: string;
  recipientId: string;
}): WishRecipient {
  return {
    id: "", // Will be assigned by persistence layer
    wishId: input.wishId,
    recipientId: input.recipientId,
    status: "sent",
    addedAt: new Date().toISOString(),
  };
}
