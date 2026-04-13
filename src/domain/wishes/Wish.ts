/**
 * Canonical Wish entity
 *
 * A wish represents a desire (for "Wished" users) or an offer (for "Wisher" users).
 * It has a creator, one or more recipients (stored separately), and a lifecycle.
 */

import { WishStatus } from "./WishStatus";

export type WishCategory =
  | "dining"
  | "travel"
  | "experience"
  | "gift"
  | "entertainment"
  | "wellness"
  | "adventure"
  | "romantic"
  | "custom";

export type WishVisibility = "private" | "connections" | "public";

export interface Wish {
  // Identity
  id: string;
  creatorId: string;
  creatorRole: "wisher" | "wished" | "both";

  // Content
  title: string;
  description?: string;
  category: WishCategory;
  customCategory?: string;
  tags: string[];

  // Media
  imageUrl?: string;

  // Location & Links
  location?: string;
  links?: string[]; // Web URLs only, NOT recipient data

  // Status & Lifecycle
  status: WishStatus;

  // Date information (if a date has been proposed)
  proposedDate?: string; // ISO date
  proposedTime?: string; // HH:MM format
  proposedBy?: string; // User ID who proposed
  confirmedBy?: string[]; // User IDs who confirmed (array instead of Set)

  // Fulfillment tracking
  fulfilledAt?: string; // ISO timestamp
  fulfilledBy?: string; // User ID who marked as fulfilled
  fulfillmentRating?: number; // 0-5
  fulfillmentPraised?: boolean;
  fulfillmentReview?: string;

  // Timestamps
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp

  // Visibility
  visibility: WishVisibility;
}

/**
 * Create a new draft wish
 */
export function createWish(input: {
  creatorId: string;
  creatorRole: "wisher" | "wished" | "both";
  title: string;
  category: WishCategory;
}): Wish {
  const now = new Date().toISOString();

  return {
    id: "", // Will be assigned by persistence layer
    creatorId: input.creatorId,
    creatorRole: input.creatorRole,
    title: input.title,
    description: undefined,
    category: input.category,
    tags: [],
    status: "draft",
    visibility: "connections",
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Check if current user is the creator of this wish
 */
export function isWishCreator(wish: Wish, userId: string): boolean {
  return wish.creatorId === userId;
}

/**
 * Check if wish can be modified (only drafts can be edited)
 */
export function canModifyWish(wish: Wish): boolean {
  return wish.status === "draft";
}
