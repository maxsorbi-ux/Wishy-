/**
 * WishRecipientMapper - Converts between Supabase rows and domain WishRecipient
 *
 * Supabase schema → Domain model
 */

import { WishRecipient, RecipientWishStatus } from "../../../domain";

/**
 * Supabase wish_recipients row format
 */
export interface SupabaseWishRecipientRow {
  id: string;
  wish_id: string;
  recipient_id: string;
  status: string;
  responded_at?: string;
  added_at: string;
}

/**
 * Convert Supabase row to domain WishRecipient
 */
export function mapSupabaseRowToWishRecipient(row: SupabaseWishRecipientRow): WishRecipient {
  return {
    id: row.id,
    wishId: row.wish_id,
    recipientId: row.recipient_id,
    status: (row.status as RecipientWishStatus) || "sent",
    respondedAt: row.responded_at,
    addedAt: row.added_at,
  };
}

/**
 * Convert domain WishRecipient to Supabase row
 */
export function mapWishRecipientToSupabaseRow(recipient: WishRecipient): SupabaseWishRecipientRow {
  return {
    id: recipient.id,
    wish_id: recipient.wishId,
    recipient_id: recipient.recipientId,
    status: recipient.status,
    responded_at: recipient.respondedAt,
    added_at: recipient.addedAt,
  };
}
