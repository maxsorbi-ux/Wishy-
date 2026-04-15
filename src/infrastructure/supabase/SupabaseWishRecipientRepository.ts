/**
 * SupabaseWishRecipientRepository - Implements IWishRecipientRepository
 */

import { WishRecipient } from "../../domain";
import { IWishRecipientRepository } from "../../application";
import { supabaseDb } from "../../api/supabase";
import {
  mapSupabaseRowToWishRecipient,
  mapWishRecipientToSupabaseRow,
  SupabaseWishRecipientRow,
} from "./mappers";

export class SupabaseWishRecipientRepository implements IWishRecipientRepository {
  async save(recipient: WishRecipient): Promise<WishRecipient> {
    const row = mapWishRecipientToSupabaseRow(recipient);

    try {
      const result = await supabaseDb.insert("wish_recipients", row);

      if (result.error) {
        throw new Error(`Failed to save recipient: ${result.error.message}`);
      }

      return recipient;
    } catch (error) {
      console.error("SupabaseWishRecipientRepository.save error:", error);
      throw error;
    }
  }

  async findByWishId(wishId: string): Promise<WishRecipient[]> {
    try {
      const result = await supabaseDb.select("wish_recipients", { wish_id: wishId });

      if (result.error) {
        throw new Error(`Failed to fetch recipients: ${result.error.message}`);
      }

      if (!result.data) {
        return [];
      }

      return result.data.map((row: SupabaseWishRecipientRow) =>
        mapSupabaseRowToWishRecipient(row)
      );
    } catch (error) {
      console.error("SupabaseWishRecipientRepository.findByWishId error:", error);
      throw error;
    }
  }

  async findByWishIds(wishIds: string[]): Promise<Map<string, WishRecipient[]>> {
    const result = new Map<string, WishRecipient[]>();
    if (wishIds.length === 0) return result;

    try {
      const response = await supabaseDb.select("wish_recipients", { wish_id: wishIds });

      if (response.error) {
        throw new Error(`Failed to batch fetch recipients: ${response.error.message}`);
      }

      // Initialize map with empty arrays for all requested wish IDs
      wishIds.forEach((id) => result.set(id, []));

      if (response.data) {
        response.data.forEach((row: SupabaseWishRecipientRow) => {
          const recipient = mapSupabaseRowToWishRecipient(row);
          const list = result.get(recipient.wishId);
          if (list) {
            list.push(recipient);
          } else {
            result.set(recipient.wishId, [recipient]);
          }
        });
      }

      return result;
    } catch (error) {
      console.error("SupabaseWishRecipientRepository.findByWishIds error:", error);
      throw error;
    }
  }

  async findByRecipientId(recipientId: string): Promise<WishRecipient[]> {
    try {
      const result = await supabaseDb.select("wish_recipients", {
        recipient_id: recipientId,
      });

      if (result.error) {
        throw new Error(`Failed to fetch recipients: ${result.error.message}`);
      }

      if (!result.data) {
        return [];
      }

      return result.data.map((row: SupabaseWishRecipientRow) =>
        mapSupabaseRowToWishRecipient(row)
      );
    } catch (error) {
      console.error("SupabaseWishRecipientRepository.findByRecipientId error:", error);
      throw error;
    }
  }

  async findByWishAndRecipient(
    wishId: string,
    recipientId: string
  ): Promise<WishRecipient | null> {
    try {
      const result = await supabaseDb.select("wish_recipients", {
        wish_id: wishId,
        recipient_id: recipientId,
      });

      if (result.error) {
        throw new Error(
          `Failed to fetch recipient: ${result.error.message}`
        );
      }

      if (!result.data || result.data.length === 0) {
        return null;
      }

      const row = result.data[0] as SupabaseWishRecipientRow;
      return mapSupabaseRowToWishRecipient(row);
    } catch (error) {
      console.error("SupabaseWishRecipientRepository.findByWishAndRecipient error:", error);
      throw error;
    }
  }

  async update(recipient: WishRecipient): Promise<void> {
    const row = mapWishRecipientToSupabaseRow(recipient);

    try {
      const result = await supabaseDb.update("wish_recipients", row, { id: recipient.id });

      if (result.error) {
        throw new Error(`Failed to update recipient: ${result.error.message}`);
      }
    } catch (error) {
      console.error("SupabaseWishRecipientRepository.update error:", error);
      throw error;
    }
  }

  async delete(recipientId: string): Promise<void> {
    try {
      const result = await supabaseDb.delete("wish_recipients", { id: recipientId });

      if (result.error) {
        throw new Error(`Failed to delete recipient: ${result.error.message}`);
      }
    } catch (error) {
      console.error("SupabaseWishRecipientRepository.delete error:", error);
      throw error;
    }
  }

  async deleteByWishId(wishId: string): Promise<void> {
    try {
      const result = await supabaseDb.delete("wish_recipients", { wish_id: wishId });

      if (result.error) {
        throw new Error(`Failed to delete recipients: ${result.error.message}`);
      }
    } catch (error) {
      console.error("SupabaseWishRecipientRepository.deleteByWishId error:", error);
      throw error;
    }
  }
}
