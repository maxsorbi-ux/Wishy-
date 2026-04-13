/**
 * RejectWish Use Case
 *
 * Recipient rejects a wish that was sent to them.
 */

import {
  Wish,
  WishRejectedEvent,
} from "../../domain";
import { IWishRepository, IWishRecipientRepository, IEventEmitter } from "../shared";
import { NotFoundError } from "../shared";

export interface RejectWishInput {
  wishId: string;
  recipientId: string;
}

export class RejectWishUseCase {
  constructor(
    private wishRepo: IWishRepository,
    private recipientRepo: IWishRecipientRepository,
    private eventEmitter: IEventEmitter
  ) {}

  async execute(input: RejectWishInput): Promise<void> {
    // 1. Fetch wish
    const wish = await this.wishRepo.findById(input.wishId);
    if (!wish) {
      throw new NotFoundError("Wish", input.wishId);
    }

    // 2. Fetch recipient record
    const recipient = await this.recipientRepo.findByWishAndRecipient(
      input.wishId,
      input.recipientId
    );
    if (!recipient) {
      throw new NotFoundError("WishRecipient", `${input.wishId}/${input.recipientId}`);
    }

    // 3. Validate: recipient must be in "sent" or "accepted" status
    if (recipient.status !== "sent" && recipient.status !== "accepted") {
      throw new Error(`Cannot reject wish in ${recipient.status} status`);
    }

    // 4. Update recipient status to "rejected"
    recipient.status = "rejected";
    recipient.respondedAt = new Date().toISOString();
    await this.recipientRepo.update(recipient);

    // 5. If ALL recipients have responded (accepted or rejected), update wish status
    const allRecipients = await this.recipientRepo.findByWishId(input.wishId);
    const allResponded = allRecipients.every(
      (r) => r.status === "accepted" || r.status === "rejected"
    );

    if (allResponded && allRecipients.some((r) => r.status === "accepted")) {
      // At least one accepted, wish stays in accepted state
      if (wish.status === "sent") {
        wish.status = "accepted";
      }
    } else if (allResponded && allRecipients.every((r) => r.status === "rejected")) {
      // All rejected
      wish.status = "rejected";
    }

    wish.updatedAt = new Date().toISOString();
    await this.wishRepo.update(wish);

    // 6. Emit event
    const event: WishRejectedEvent = {
      type: "wish.rejected",
      aggregateType: "wish",
      aggregateId: input.wishId,
      occurredAt: new Date().toISOString(),
      data: {
        wishId: input.wishId,
        recipientId: input.recipientId,
        creatorId: wish.creatorId,
        title: wish.title,
      },
    };

    this.eventEmitter.emit(event);
  }
}
