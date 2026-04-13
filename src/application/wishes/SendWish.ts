/**
 * SendWish Use Case
 *
 * Creator sends a draft wish to one or more recipients.
 */

import {
  Wish,
  WishRecipient,
  createWishRecipient,
  WishSentEvent,
} from "../../domain";
import { IWishRepository, IWishRecipientRepository, IEventEmitter } from "../shared";
import { NotFoundError } from "../shared";

export interface SendWishInput {
  wishId: string;
  creatorId: string;
  recipientIds: string[];
}

export class SendWishUseCase {
  constructor(
    private wishRepo: IWishRepository,
    private recipientRepo: IWishRecipientRepository,
    private eventEmitter: IEventEmitter
  ) {}

  async execute(input: SendWishInput): Promise<void> {
    // 1. Fetch wish
    const wish = await this.wishRepo.findById(input.wishId);
    if (!wish) {
      throw new NotFoundError("Wish", input.wishId);
    }

    // 2. Validate: creator must match
    if (wish.creatorId !== input.creatorId) {
      throw new Error("Only creator can send wish");
    }

    // 3. Validate: must be draft status
    if (wish.status !== "draft") {
      throw new Error("Only draft wishes can be sent");
    }

    // 4. Validate: at least one recipient
    if (input.recipientIds.length === 0) {
      throw new Error("At least one recipient is required");
    }

    // 5. Validate: creator cannot be recipient
    if (input.recipientIds.includes(input.creatorId)) {
      throw new Error("Cannot send wish to yourself");
    }

    // 6. Update wish status to "sent"
    wish.status = "sent";
    wish.updatedAt = new Date().toISOString();
    await this.wishRepo.update(wish);

    // 7. Create recipient records for each recipient
    for (const recipientId of input.recipientIds) {
      const recipient = createWishRecipient({
        wishId: input.wishId,
        recipientId,
      });
      await this.recipientRepo.save(recipient);
    }

    // 8. Emit event
    const event: WishSentEvent = {
      type: "wish.sent",
      aggregateType: "wish",
      aggregateId: input.wishId,
      occurredAt: new Date().toISOString(),
      data: {
        wishId: input.wishId,
        creatorId: input.creatorId,
        recipientIds: input.recipientIds,
        title: wish.title,
      },
    };

    this.eventEmitter.emit(event);
  }
}
