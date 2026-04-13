/**
 * ViewModels - Data Transfer Objects for UI consumption
 * 
 * These combine domain entities with related data to provide complete views
 * for UI screens without the screens needing to orchestrate multiple loads.
 */

import { Wish, WishRecipient } from "../../domain";

/**
 * WishViewDTO - Complete wish view with recipient data
 * 
 * Combines the domain Wish entity with its recipients and computed fields
 * for UI consumption. This replaces the legacy targetUserIds pattern.
 */
export interface WishViewDTO extends Wish {
  // Recipients for this wish
  recipients: WishRecipient[];
  
  // Legacy computed field for backward compatibility during migration
  // Will be deprecated once screens are updated
  targetUserIds?: string[]; // Computed from recipients array
}

/**
 * Helper to create a WishViewDTO from a Wish and its recipients
 */
export function createWishViewDTO(wish: Wish, recipients: WishRecipient[]): WishViewDTO {
  // Extract recipient user IDs for backward compatibility
  const targetUserIds = recipients.map(r => r.recipientId);
  
  return {
    ...wish,
    recipients,
    targetUserIds: targetUserIds.length > 0 ? targetUserIds : undefined,
  };
}

/**
 * Helper to batch create WishViewDTOs
 */
export function createWishViewDTOs(
  wishes: Wish[],
  recipientsByWishId: Map<string, WishRecipient[]>
): WishViewDTO[] {
  return wishes.map(wish => {
    const recipients = recipientsByWishId.get(wish.id) || [];
    return createWishViewDTO(wish, recipients);
  });
}
