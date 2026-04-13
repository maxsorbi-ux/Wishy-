/**
 * SendConnectionRequest Use Case
 *
 * User sends a connection request to another user.
 */

import {
  ConnectionRequest,
  createConnectionRequest,
  ConnectionRequestSentEvent,
} from "../../domain";
import { IEventEmitter } from "../shared";

export interface IConnectionRequestRepository {
  save(request: ConnectionRequest): Promise<ConnectionRequest>;
  findById(id: string): Promise<ConnectionRequest | null>;
  findBySenderAndReceiver(senderId: string, receiverId: string): Promise<ConnectionRequest | null>;
}

export interface SendConnectionRequestInput {
  senderId: string;
  receiverId: string;
  message?: string;
}

export class SendConnectionRequestUseCase {
  constructor(
    private requestRepo: IConnectionRequestRepository,
    private eventEmitter: IEventEmitter
  ) {}

  async execute(input: SendConnectionRequestInput): Promise<string> {
    // 1. Validate: cannot send request to yourself
    if (input.senderId === input.receiverId) {
      throw new Error("Cannot send connection request to yourself");
    }

    // 2. Check if request already exists
    const existing = await this.requestRepo.findBySenderAndReceiver(
      input.senderId,
      input.receiverId
    );
    if (existing && existing.status === "pending") {
      throw new Error("Connection request already pending");
    }

    // 3. Create new request
    const request = createConnectionRequest({
      senderId: input.senderId,
      receiverId: input.receiverId,
      message: input.message,
    });

    // 4. Save request
    const saved = await this.requestRepo.save(request);

    // 5. Emit event
    const event: ConnectionRequestSentEvent = {
      type: "connection.requestSent",
      aggregateType: "connection",
      aggregateId: saved.id,
      occurredAt: new Date().toISOString(),
      data: {
        requestId: saved.id,
        senderId: input.senderId,
        receiverId: input.receiverId,
        message: input.message,
      },
    };

    this.eventEmitter.emit(event);

    return saved.id;
  }
}
