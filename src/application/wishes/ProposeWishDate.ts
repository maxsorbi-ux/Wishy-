/**
 * ProposeWishDate Use Case
 *
 * Creator or recipient proposes a date/time for the wish fulfillment.
 */

import {
  Wish,
  WishDateProposedEvent,
} from "../../domain";
import { IWishRepository, IEventEmitter } from "../shared";
import { NotFoundError } from "../shared";

export interface ProposeWishDateInput {
  wishId: string;
  proposedBy: string;
  date: string; // ISO date format
  time: string; // HH:MM format
}

export class ProposeWishDateUseCase {
  constructor(
    private wishRepo: IWishRepository,
    private eventEmitter: IEventEmitter
  ) {}

  async execute(input: ProposeWishDateInput): Promise<void> {
    // 1. Fetch wish
    const wish = await this.wishRepo.findById(input.wishId);
    if (!wish) {
      throw new NotFoundError("Wish", input.wishId);
    }

    // 2. Validate: wish must be in accepted status
    if (wish.status !== "accepted") {
      throw new Error(`Cannot propose date for wish in ${wish.status} status`);
    }

    // 3. Validate: proposer must be creator or recipient
    if (wish.creatorId !== input.proposedBy) {
      throw new Error("Only creator or recipient can propose date");
    }

    // 4. Validate: date is in the future
    const proposedDateTime = new Date(`${input.date}T${input.time}`);
    if (proposedDateTime < new Date()) {
      throw new Error("Proposed date must be in the future");
    }

    // 5. Update wish with proposed date
    wish.status = "date_set";
    wish.proposedDate = input.date;
    wish.proposedTime = input.time;
    wish.proposedBy = input.proposedBy;
    wish.confirmedBy = undefined; // Reset confirmations
    wish.updatedAt = new Date().toISOString();
    await this.wishRepo.update(wish);

    // 6. Emit event
    const event: WishDateProposedEvent = {
      type: "wish.dateProposed",
      aggregateType: "wish",
      aggregateId: input.wishId,
      occurredAt: new Date().toISOString(),
      data: {
        wishId: input.wishId,
        proposedBy: input.proposedBy,
        proposedDate: input.date,
        proposedTime: input.time,
        title: wish.title,
      },
    };

    this.eventEmitter.emit(event);
  }
}
