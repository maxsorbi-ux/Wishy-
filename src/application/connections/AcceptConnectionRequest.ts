/**
 * AcceptConnectionRequest Use Case
 *
 * User accepts a connection request and creates a connection.
 */

import {
  Connection,
  createConnection,
  ConnectionType,
  ConnectionRequestAcceptedEvent,
} from "../../domain";
import { IConnectionRequestRepository } from "./SendConnectionRequest";
import { IEventEmitter } from "../shared";

export interface IConnectionRepository {
  save(connection: Connection): Promise<Connection>;
  findById(id: string): Promise<Connection | null>;
  findByUserPair(user1Id: string, user2Id: string): Promise<Connection | null>;
  findByUserId(userId: string): Promise<Connection[]>;
  findPendingRequestsForUser(userId: string): Promise<any[]>;
}

export interface AcceptConnectionRequestInput {
  requestId: string;
  connectionType: ConnectionType;
}

export class AcceptConnectionRequestUseCase {
  constructor(
    private requestRepo: IConnectionRequestRepository,
    private connectionRepo: IConnectionRepository,
    private eventEmitter: IEventEmitter
  ) {}

  async execute(input: AcceptConnectionRequestInput): Promise<string> {
    // 1. Fetch request
    const request = await this.requestRepo.findById(input.requestId);
    if (!request) {
      throw new Error(`Connection request ${input.requestId} not found`);
    }

    // 2. Validate: request must be pending
    if (request.status !== "pending") {
      throw new Error(`Cannot accept request with status: ${request.status}`);
    }

    // 3. Mark request as accepted
    request.status = "accepted";
    request.respondedAt = new Date().toISOString();
    await this.requestRepo.save(request);

    // 4. Create connection
    const connection = createConnection({
      user1Id: request.senderId,
      user2Id: request.receiverId,
      type: input.connectionType,
    });

    const saved = await this.connectionRepo.save(connection);

    // 5. Emit event
    const event: ConnectionRequestAcceptedEvent = {
      type: "connection.requestAccepted",
      aggregateType: "connection",
      aggregateId: saved.id,
      occurredAt: new Date().toISOString(),
      data: {
        requestId: input.requestId,
        connectionId: saved.id,
        senderId: request.senderId,
        receiverId: request.receiverId,
        connectionType: input.connectionType,
      },
    };

    this.eventEmitter.emit(event);

    return saved.id;
  }
}
