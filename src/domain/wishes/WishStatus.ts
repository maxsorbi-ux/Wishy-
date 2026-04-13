/**
 * Wish Status - The canonical state machine for wishes
 *
 * States and transitions:
 * draft → sent → accepted → date_set → confirmed → fulfilled
 *       ↘ sent → rejected
 *       ↘ deleted
 */

export type WishStatus =
  | "draft"       // Created but not sent to anyone
  | "sent"        // Sent to one or more recipients, awaiting response
  | "accepted"    // Recipient has accepted, awaiting date proposal
  | "date_set"    // Date has been proposed
  | "confirmed"   // Both parties confirmed the date
  | "fulfilled"   // Wish has been completed and rated
  | "rejected"    // Recipient declined the wish
  | "deleted";    // Wish has been deleted

export const WISH_STATUSES: ReadonlyArray<WishStatus> = [
  "draft",
  "sent",
  "accepted",
  "date_set",
  "confirmed",
  "fulfilled",
  "rejected",
  "deleted",
];

/**
 * Lifecycle policy: which transitions are allowed from which status
 */
export const ALLOWED_WISH_TRANSITIONS: Record<WishStatus, WishStatus[]> = {
  draft: ["sent", "deleted"],
  sent: ["accepted", "rejected", "deleted"],
  accepted: ["date_set", "rejected"],
  date_set: ["confirmed", "rejected"],
  confirmed: ["fulfilled", "rejected"],
  fulfilled: [], // Terminal state
  rejected: [], // Terminal state
  deleted: [], // Terminal state
};

/**
 * Check if a transition is allowed
 */
export function isWishTransitionAllowed(from: WishStatus, to: WishStatus): boolean {
  const allowed = ALLOWED_WISH_TRANSITIONS[from];
  if (!allowed) return false;
  for (const status of allowed) {
    if (status === to) return true;
  }
  return false;
}

/**
 * Human-readable labels for UI
 */
export const WISH_STATUS_LABELS: Record<WishStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  date_set: "Date Set",
  confirmed: "Confirmed",
  fulfilled: "Fulfilled",
  rejected: "Rejected",
  deleted: "Deleted",
};

/**
 * Determine if a wish is in a terminal state (no more transitions possible)
 */
export function isWishTerminal(status: WishStatus): boolean {
  return ALLOWED_WISH_TRANSITIONS[status].length === 0;
}

/**
 * Determine if a wish is still actionable by recipients
 */
export function isWishPending(status: WishStatus): boolean {
  return status === "sent" || status === "accepted" || status === "date_set";
}
