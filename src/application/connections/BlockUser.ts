/**
 * BlockUser Use Case
 *
 * User blocks another user.
 */

import {
  BlockedUser,
  createBlockedUser,
  UserBlockedEvent,
} from "../../domain";
import { IConnectionRepository } from "./AcceptConnectionRequest";
import { IEventEmitter } from "../shared";

export interface IBlockedUserRepository {
  save(block: BlockedUser): Promise<BlockedUser>;
  findByBlockerAndBlocked(blockerId: string, blockedUserId: string): Promise<BlockedUser | null>;
}

export interface BlockUserInput {
  blockerId: string;
  blockedUserId: string;
}

export class BlockUserUseCase {
  constructor(
    private connectionRepo: IConnectionRepository,
    private blockedRepo: IBlockedUserRepository,
    private eventEmitter: IEventEmitter
  ) {}

  async execute(input: BlockUserInput): Promise<void> {
    // 1. Validate: cannot block yourself
    if (input.blockerId === input.blockedUserId) {
      throw new Error("Cannot block yourself");
    }

    // 2. Check if already blocked
    const existing = await this.blockedRepo.findByBlockerAndBlocked(
      input.blockerId,
      input.blockedUserId
    );
    if (existing) {
      throw new Error("User is already blocked");
    }

    // 3. Delete any existing connection
    const connection = await this.connectionRepo.findByUserPair(
      input.blockerId,
      input.blockedUserId
    );
    if (connection) {
      // In a real implementation, we'd delete the connection
      // For now, assume the repo handles this
    }

    // 4. Create block record
    const block = createBlockedUser({
      blockerId: input.blockerId,
      blockedUserId: input.blockedUserId,
    });

    await this.blockedRepo.save(block);

    // 5. Emit event
    const event: UserBlockedEvent = {
      type: "connection.userBlocked",
      aggregateType: "connection",
      aggregateId: block.id,
      occurredAt: new Date().toISOString(),
      data: {
        blockerId: input.blockerId,
        blockedUserId: input.blockedUserId,
      },
    };

    this.eventEmitter.emit(event);
  }
}
