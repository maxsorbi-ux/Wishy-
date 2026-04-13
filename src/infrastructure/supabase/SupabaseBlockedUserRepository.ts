/**
 * SupabaseBlockedUserRepository - Implements IBlockedUserRepository
 */

import { BlockedUser } from "../../../domain";
import { IBlockedUserRepository } from "../../../application/connections/BlockUser";
import { supabaseDb } from "../../../api/supabase";
import {
  mapSupabaseRowToBlockedUser,
  mapBlockedUserToSupabaseRow,
  SupabaseBlockedUserRow,
} from "./mappers";

export class SupabaseBlockedUserRepository implements IBlockedUserRepository {
  async save(block: BlockedUser): Promise<BlockedUser> {
    const row = mapBlockedUserToSupabaseRow(block);

    try {
      const result = await supabaseDb.insert("blocked_users", row);

      if (result.error) {
        throw new Error(`Failed to save block: ${result.error.message}`);
      }

      return block;
    } catch (error) {
      console.error("SupabaseBlockedUserRepository.save error:", error);
      throw error;
    }
  }

  async findByBlockerAndBlocked(
    blockerId: string,
    blockedUserId: string
  ): Promise<BlockedUser | null> {
    try {
      const result = await supabaseDb.select("blocked_users", {
        blocker_id: blockerId,
        blocked_user_id: blockedUserId,
      });

      if (result.error) {
        throw new Error(`Failed to fetch block: ${result.error.message}`);
      }

      if (!result.data || result.data.length === 0) {
        return null;
      }

      const row = result.data[0] as SupabaseBlockedUserRow;
      return mapSupabaseRowToBlockedUser(row);
    } catch (error) {
      console.error("SupabaseBlockedUserRepository.findByBlockerAndBlocked error:", error);
      throw error;
    }
  }
}
