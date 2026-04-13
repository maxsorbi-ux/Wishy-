/**
 * BlockedUserMapper - Converts between Supabase rows and domain entities
 */

import { BlockedUser, createBlockedUser } from "../../../domain";

export interface SupabaseBlockedUserRow {
  id: string;
  blocker_id: string;
  blocked_user_id: string;
  blocked_at: string;
  created_at?: string;
  updated_at?: string;
}

export function mapSupabaseRowToBlockedUser(
  row: SupabaseBlockedUserRow
): BlockedUser {
  return {
    id: row.id,
    blockerId: row.blocker_id,
    blockedUserId: row.blocked_user_id,
    blockedAt: row.blocked_at,
  };
}

export function mapBlockedUserToSupabaseRow(
  block: BlockedUser
): SupabaseBlockedUserRow {
  return {
    id: block.id,
    blocker_id: block.blockerId,
    blocked_user_id: block.blockedUserId,
    blocked_at: block.blockedAt,
  };
}
