/**
 * ConnectionRequest - Request to connect with another user
 *
 * Separate from Connection because requests are unidirectional and have their own lifecycle.
 */

export type ConnectionRequestStatus = "pending" | "accepted" | "rejected";

export interface ConnectionRequest {
  id: string;
  senderId: string;
  receiverId: string;
  message?: string;
  status: ConnectionRequestStatus;

  // Timestamps
  sentAt: string; // ISO timestamp
  respondedAt?: string; // ISO timestamp
}

/**
 * Check if request is still pending
 */
export function isConnectionRequestPending(request: ConnectionRequest): boolean {
  return request.status === "pending";
}

/**
 * Create a new connection request
 */
export function createConnectionRequest(input: {
  senderId: string;
  receiverId: string;
  message?: string;
}): ConnectionRequest {
  return {
    id: "", // Will be assigned by persistence layer
    senderId: input.senderId,
    receiverId: input.receiverId,
    message: input.message,
    status: "pending",
    sentAt: new Date().toISOString(),
  };
}
