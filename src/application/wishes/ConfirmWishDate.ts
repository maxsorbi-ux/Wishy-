/**
 * ConfirmWishDate Use Case
 *
 * Creator or recipient confirms a proposed date/time.
 */

import {
  Wish,
  WishDateConfirmedEvent,
} from "../../domain";
import { IWishRepository, IEventEmitter } from "../shared";
import { NotFoundError } from "../shared";

export interface ConfirmWishDateInput {
  wishId: string;
  confirmedBy: string;
}

export class ConfirmWishDateUseCase {
  constructor(
    private wishRepo: IWishRepository,
    private eventEmitter: IEventEmitter
  ) {}

  async execute(input: ConfirmWishDateInput): Promise<void> {
    // 1. Fetch wish
    const wish = await this.wishRepo.findById(input.wishId);
    if (!wish) {
      throw new NotFoundError("Wish", input.wishId);
    }

    // 2. Validate: wish must have a proposed date
    if (!wish.proposedDate || !wish.proposedTime) {
      throw new Error("No date has been proposed yet");
    }

    // 3. Validate: must be in date_set or confirmed status
    if (wish.status !== "date_set" && wish.status !== "confirmed") {
      throw new Error(`Cannot confirm date for wish in ${wish.status} status`);
    }

    // 4. Add confirmer to confirmations
    if (!wish.confirmedBy) {
      wish.confirmedBy = [];
    }
    let alreadyConfirmed = false;
    for (const id of wish.confirmedBy) {
      if (id === input.confirmedBy) {
        alreadyConfirmed = true;
        break;
      }
    }
    if (!alreadyConfirmed) {
      wish.confirmedBy.push(input.confirmedBy);
    }

    // 5. If both creator and recipient confirmed, move to confirmed
    if (wish.confirmedBy.length >= 2 || wish.status === "confirmed") {
      wish.status = "confirmed";
    }

    wish.updatedAt = new Date().toISOString();
    await this.wishRepo.update(wish);

    // 6. Emit event
    const event: WishDateConfirmedEvent = {
      type: "wish.dateConfirmed",
      aggregateType: "wish",
      aggregateId: input.wishId,
      occurredAt: new Date().toISOString(),
      data: {
        wishId: input.wishId,
        confirmedBy: input.confirmedBy,
        confirmedDate: wish.proposedDate,
        title: wish.title,
      },
    };

    this.eventEmitter.emit(event);
  }
}
