/**
 * SupabaseWishRepository - Implements IWishRepository for Supabase persistence
 */

import { Wish } from "../../../domain";
import { IWishRepository } from "../../../application";
import { supabaseDb } from "../../../api/supabase";
import {
  mapSupabaseRowToWish,
  mapWishToSupabaseRow,
  SupabaseWishRow,
} from "./mappers";

export class SupabaseWishRepository implements IWishRepository {
  /**
   * Save a wish with optional recipient IDs
   * Recipients are stored in wish_recipients table (canonical location)
   */
  async save(wish: Wish, recipientIds?: string[]): Promise<Wish> {
    const row = mapWishToSupabaseRow(wish);

    try {
      const result = await supabaseDb.insert("wishes", row);

      if (result.error) {
        throw new Error(`Failed to save wish: ${result.error.message}`);
      }

      // If recipients provided, add them to wish_recipients table
      if (recipientIds && recipientIds.length > 0) {
        for (const recipientId of recipientIds) {
          await supabaseDb.insert("wish_recipients", {
            wish_id: wish.id,
            recipient_id: recipientId,
          });
        }
      }

      return wish;
    } catch (error) {
      console.error("SupabaseWishRepository.save error:", error);
      throw error;
    }
  }

  async findById(wishId: string): Promise<Wish | null> {
    try {
      const result = await supabaseDb.select("wishes", { id: wishId });

      if (result.error) {
        throw new Error(`Failed to fetch wish: ${result.error.message}`);
      }

      if (!result.data || result.data.length === 0) {
        return null;
      }

      const row = result.data[0] as SupabaseWishRow;
      return mapSupabaseRowToWish(row);
    } catch (error) {
      console.error("SupabaseWishRepository.findById error:", error);
      throw error;
    }
  }

  async findByCreatorId(creatorId: string): Promise<Wish[]> {
    try {
      const result = await supabaseDb.select("wishes", { creator_id: creatorId });

      if (result.error) {
        throw new Error(`Failed to fetch wishes: ${result.error.message}`);
      }

      if (!result.data) {
        return [];
      }

      return result.data.map((row: SupabaseWishRow) => mapSupabaseRowToWish(row));
    } catch (error) {
      console.error("SupabaseWishRepository.findByCreatorId error:", error);
      throw error;
    }
  }

  async findRecipientWishes(userId: string): Promise<Wish[]> {
    try {
      // Query wish_recipients to find which wishes this user is a recipient of
      const recipientResult = await supabaseDb.select("wish_recipients", {
        recipient_id: userId,
      });

      if (recipientResult.error) {
        throw new Error(`Failed to fetch recipients: ${recipientResult.error.message}`);
      }

      if (!recipientResult.data || recipientResult.data.length === 0) {
        return [];
      }

      // Get wish IDs
      const wishIds = recipientResult.data.map((r: { wish_id: string }) => r.wish_id);

      // Batch fetch all wishes (more efficient than N individual queries)
      const wishesResult = await supabaseDb.select("wishes", {
        id: wishIds,
      });

      if (wishesResult.error) {
        throw new Error(`Failed to fetch wishes: ${wishesResult.error.message}`);
      }

      if (!wishesResult.data) {
        return [];
      }

      return wishesResult.data.map((row: SupabaseWishRow) => mapSupabaseRowToWish(row));
    } catch (error) {
      console.error("SupabaseWishRepository.findRecipientWishes error:", error);
      throw error;
    }
  }

  async findAll(): Promise<Wish[]> {
    try {
      const result = await supabaseDb.select("wishes", {});

      if (result.error) {
        throw new Error(`Failed to fetch wishes: ${result.error.message}`);
      }

      if (!result.data) {
        return [];
      }

      return result.data.map((row: SupabaseWishRow) => mapSupabaseRowToWish(row));
    } catch (error) {
      console.error("SupabaseWishRepository.findAll error:", error);
      throw error;
    }
  }

  async update(wish: Wish, recipientIds?: string[]): Promise<void> {
    const row = mapWishToSupabaseRow(wish);

    try {
      const result = await supabaseDb.update("wishes", row, { id: wish.id });

      if (result.error) {
        throw new Error(`Failed to update wish: ${result.error.message}`);
      }

      // If recipients provided, update wish_recipients table
      if (recipientIds !== undefined) {
        // Delete existing recipients for this wish
        await supabaseDb.delete("wish_recipients", { wish_id: wish.id });

        // Add new recipients
        if (recipientIds.length > 0) {
          for (const recipientId of recipientIds) {
            await supabaseDb.insert("wish_recipients", {
              wish_id: wish.id,
              recipient_id: recipientId,
            });
          }
        }
      }
    } catch (error) {
      console.error("SupabaseWishRepository.update error:", error);
      throw error;
    }
  }

  async delete(wishId: string): Promise<void> {
    try {
      const result = await supabaseDb.delete("wishes", { id: wishId });

      if (result.error) {
        throw new Error(`Failed to delete wish: ${result.error.message}`);
      }

      // Also delete recipients
      await supabaseDb.delete("wish_recipients", { wish_id: wishId });
    } catch (error) {
      console.error("SupabaseWishRepository.delete error:", error);
      throw error;
    }
  }
}
