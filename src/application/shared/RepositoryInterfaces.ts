/**
 * Repository interfaces
 *
 * These define the contract that any persistence implementation must follow.
 * Repositories are the ONLY way use cases interact with data.
 */

import { Wish, WishRecipient } from "../../domain";

/**
 * WishRepository - Persistence interface for wishes
 */
export interface IWishRepository {
  // Create
  save(wish: Wish): Promise<Wish>; // Returns wish with ID assigned

  // Read
  findById(wishId: string): Promise<Wish | null>;
  findByCreatorId(creatorId: string): Promise<Wish[]>;
  findRecipientWishes(userId: string): Promise<Wish[]>;
  findAll(): Promise<Wish[]>;

  // Update
  update(wish: Wish): Promise<void>;

  // Delete
  delete(wishId: string): Promise<void>;
}

/**
 * WishRecipientRepository - Persistence interface for wish recipients
 */
export interface IWishRecipientRepository {
  // Create
  save(recipient: WishRecipient): Promise<WishRecipient>;

  // Read
  findByWishId(wishId: string): Promise<WishRecipient[]>;
  findByWishIds(wishIds: string[]): Promise<Map<string, WishRecipient[]>>;
  findByRecipientId(recipientId: string): Promise<WishRecipient[]>;
  findByWishAndRecipient(wishId: string, recipientId: string): Promise<WishRecipient | null>;

  // Update
  update(recipient: WishRecipient): Promise<void>;

  // Delete
  delete(recipientId: string): Promise<void>;
  deleteByWishId(wishId: string): Promise<void>;
}
