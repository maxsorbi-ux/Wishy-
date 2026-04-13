/**
 * FulfillWish Use Case
 *
 * Recipient marks a wish as fulfilled and provides a rating.
 */

import {
  Wish,
  WishFulfilledEvent,
} from "../../domain";
import { IWishRepository, IWishRecipientRepository, IEventEmitter } from "../shared";
import { NotFoundError } from "../shared";

export interface FulfillWishInput {
  wishId: string;
  fulfilledBy: string;
  rating: number; // 0-5
  praised: boolean;
  review?: string;
}

export class FulfillWishUseCase {
  constructor(
    private wishRepo: IWishRepository,
    private recipientRepo: IWishRecipientRepository,
    private eventEmitter: IEventEmitter
  ) {}

  async execute(input: FulfillWishInput): Promise<void> {
    // 1. Fetch wish
    const wish = await this.wishRepo.findById(input.wishId);
    if (!wish) {
      throw new NotFoundError("Wish", input.wishId);
    }

    // 2. Validate: can only fulfill accepted or confirmed wishes
    if (wish.status !== "accepted" && wish.status !== "confirmed") {
      throw new Error(`Cannot fulfill wish with status: ${wish.status}`);
    }

    // 3. Validate: only non-creator can fulfill (the recipient)
    if (wish.creatorId === input.fulfilledBy) {
      throw new Error("Creator cannot fulfill their own wish");
    }

    // 4. Validate: rating must be 0-5
    if (input.rating < 0 || input.rating > 5) {
      throw new Error("Rating must be between 0 and 5");
    }

    // 5. Update wish as fulfilled
    wish.status = "fulfilled";
    wish.fulfilledAt = new Date().toISOString();
    wish.fulfilledBy = input.fulfilledBy;
    wish.fulfillmentRating = input.rating;
    wish.fulfillmentPraised = input.praised;
    wish.fulfillmentReview = input.review;
    wish.updatedAt = new Date().toISOString();
    await this.wishRepo.update(wish);

    // 6. Emit event
    const event: WishFulfilledEvent = {
      type: "wish.fulfilled",
      aggregateType: "wish",
      aggregateId: input.wishId,
      occurredAt: new Date().toISOString(),
      data: {
        wishId: input.wishId,
        ratedBy: input.fulfilledBy,
        rating: input.rating,
        praised: input.praised,
        review: input.review,
        title: wish.title,
      },
    };

    this.eventEmitter.emit(event);
  }
}
