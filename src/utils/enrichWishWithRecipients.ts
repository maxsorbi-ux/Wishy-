/**
 * Helper utility to enrich wishes with recipient data
 * 
 * This bridges the gap between domain entities (which separate recipients)
 * and the UI layer (which expects targetUserIds on the Wish object).
 */

import { Wish } from "../domain";
import { IWishRecipientRepository } from "../application";

/**
 * Type for a Wish enriched with recipient IDs
 * Temporary compatibility type used during migration to ViewDTOs
 */
export type EnrichedWish = Wish & { targetUserIds?: string[] };

/**
 * Enrich a wish with target user IDs for UI consumption
 * This adds the targetUserIds field that screens expect
 */
export function enrichWishWithRecipients(wish: Wish, recipientIds: string[]): EnrichedWish {
  return {
    ...wish,
    targetUserIds: recipientIds.length > 0 ? recipientIds : undefined,
  };
}

/**
 * Batch enrich multiple wishes with recipients using a single query
 * Replaces the N+1 pattern of calling findByWishId per wish
 */
export async function batchEnrichWishes(
  wishes: Wish[],
  wishRecipientRepository: IWishRecipientRepository
): Promise<EnrichedWish[]> {
  if (wishes.length === 0) return [];

  const wishIds = wishes.map((w) => w.id);
  const recipientMap = await wishRecipientRepository.findByWishIds(wishIds);

  return wishes.map((wish) => {
    const recipients = recipientMap.get(wish.id) || [];
    const targetUserIds = recipients.map((r) => r.recipientId);
    return {
      ...wish,
      targetUserIds: targetUserIds.length > 0 ? targetUserIds : undefined,
    };
  });
}

/**
 * Enrich a single wish with recipients from the repository
 */
export async function enrichSingleWish(
  wish: Wish,
  wishRecipientRepository: IWishRecipientRepository
): Promise<EnrichedWish> {
  const recipients = await wishRecipientRepository.findByWishId(wish.id);
  const targetUserIds = recipients.map((r) => r.recipientId);
  return {
    ...wish,
    targetUserIds: targetUserIds.length > 0 ? targetUserIds : undefined,
  };
}
