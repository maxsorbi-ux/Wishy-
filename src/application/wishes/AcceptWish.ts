/**
 * AcceptWish Use Case
 *
 * A recipient accepts a wish that was sent to them.
 * This opens a chat and transitions the wish status.
 */

import {
  Wish,
  WishRecipient,
  isWishTransitionAllowed,
  InvalidWishTransitionError,
  UserNotAuthorizedError,
  WishAcceptedEvent,
} from "../../domain";
import { IWishRepository, IWishRecipientRepository, IEventEmitter } from "../shared";
import { NotFoundError } from "../shared";

export interface AcceptWishInput {
  wishId: string;
  recipientId: string;
}

export class AcceptWishUseCase {
  constructor(
    private wishRepo: IWishRepository,
    private recipientRepo: IWishRecipientRepository,
    private eventEmitter: IEventEmitter
  ) {}

  async execute(input: AcceptWishInput): Promise<void> {
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

    // 3. Validate: recipient cannot be the creator
    if (wish.creatorId === input.recipientId) {
      throw new UserNotAuthorizedError(input.recipientId, "accept own wish");
    }

    // 4. Validate: wish must be in "sent" status
    if (!isWishTransitionAllowed(wish.status, "accepted")) {
      throw new InvalidWishTransitionError(wish.status, "accepted");
    }

    // 5. Validate: recipient must be in "sent" status
    if (recipient.status !== "sent") {
      throw new InvalidWishTransitionError(recipient.status, "accepted");
    }

    // 6. Update wish status
    wish.status = "accepted";
    wish.updatedAt = new Date().toISOString();
    await this.wishRepo.update(wish);

    // 7. Update recipient status
    recipient.status = "accepted";
    recipient.respondedAt = new Date().toISOString();
    await this.recipientRepo.update(recipient);

    // 8. Emit event
    const event: WishAcceptedEvent = {
      type: "wish.accepted",
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
