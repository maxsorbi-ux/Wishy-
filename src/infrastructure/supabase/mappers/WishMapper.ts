/**
 * WishMapper - Converts between Supabase rows and domain Wish entities
 *
 * Supabase schema → Domain model
 */

import { Wish, WishStatus, WishCategory, WishVisibility } from "../../../domain";

/**
 * Supabase wish row format
 * (This is what's currently stored in the database)
 */
export interface SupabaseWishRow {
  id: string;
  creator_id: string;
  creator_role: "wisher" | "wished" | "both";
  title: string;
  description?: string;
  category: string;
  custom_category?: string;
  tags?: string[];
  image?: string;
  location?: string;
  links?: string[]; // Contains only URLs (recipients stored in wish_recipients table)
  status: string;
  proposed_date?: string;
  proposed_time?: string;
  proposed_by?: string;
  confirmed_by?: string[]; // User IDs who confirmed
  fulfilled_at?: string;
  fulfilled_by?: string;
  fulfillment_rating?: number;
  fulfillment_praised?: boolean;
  fulfillment_review?: string;
  visibility: string;
  created_at: string;
  updated_at: string;
}

/**
 * Convert Supabase row to domain Wish
 * Links field contains only URLs (recipients are in wish_recipients table)
 */
export function mapSupabaseRowToWish(row: SupabaseWishRow): Wish {
  return {
    id: row.id,
    creatorId: row.creator_id,
    creatorRole: row.creator_role,
    title: row.title,
    description: row.description,
    category: (row.category as WishCategory) || "custom",
    customCategory: row.custom_category,
    tags: row.tags || [],
    imageUrl: row.image,
    location: row.location,
    links: row.links && row.links.length > 0 ? row.links : undefined,
    status: (row.status as WishStatus) || "draft",
    proposedDate: row.proposed_date,
    proposedTime: row.proposed_time,
    proposedBy: row.proposed_by,
    confirmedBy: row.confirmed_by || undefined,
    fulfilledAt: row.fulfilled_at,
    fulfilledBy: row.fulfilled_by,
    fulfillmentRating: row.fulfillment_rating,
    fulfillmentPraised: row.fulfillment_praised,
    fulfillmentReview: row.fulfillment_review,
    visibility: (row.visibility as WishVisibility) || "connections",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Convert domain Wish to Supabase row
 * Links field contains only URLs (recipients are managed through wish_recipients table)
 */
export function mapWishToSupabaseRow(wish: Wish): SupabaseWishRow {
  return {
    id: wish.id,
    creator_id: wish.creatorId,
    creator_role: wish.creatorRole,
    title: wish.title,
    description: wish.description,
    category: wish.category,
    custom_category: wish.customCategory,
    tags: wish.tags,
    image: wish.imageUrl,
    location: wish.location,
    links: wish.links && wish.links.length > 0 ? wish.links : undefined,
    status: wish.status,
    proposed_date: wish.proposedDate,
    proposed_time: wish.proposedTime,
    proposed_by: wish.proposedBy,
    confirmed_by: wish.confirmedBy,
    fulfilled_at: wish.fulfilledAt,
    fulfilled_by: wish.fulfilledBy,
    fulfillment_rating: wish.fulfillmentRating,
    fulfillment_praised: wish.fulfillmentPraised,
    fulfillment_review: wish.fulfillmentReview,
    visibility: wish.visibility,
    created_at: wish.createdAt,
    updated_at: wish.updatedAt,
  };
}
