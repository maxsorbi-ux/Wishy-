/**
 * RelationshipUpgradeRequest - Request to upgrade a friend connection to relationship
 *
 * Either user in a friend connection can request an upgrade to relationship status.
 */

export type UpgradeRequestStatus = "pending" | "accepted" | "rejected";

export interface RelationshipUpgradeRequest {
  id: string;
  connectionId: string;
  requestedBy: string; // User ID who initiated the request
  otherUserId: string; // The other user in the connection
  status: UpgradeRequestStatus;

  // Timestamps
  requestedAt: string; // ISO timestamp
  respondedAt?: string; // ISO timestamp
}

/**
 * Check if upgrade request is pending
 */
export function isUpgradeRequestPending(request: RelationshipUpgradeRequest): boolean {
  return request.status === "pending";
}

/**
 * Create a new relationship upgrade request
 */
export function createRelationshipUpgradeRequest(input: {
  connectionId: string;
  requestedBy: string;
  otherUserId: string;
}): RelationshipUpgradeRequest {
  return {
    id: "", // Will be assigned by persistence layer
    connectionId: input.connectionId,
    requestedBy: input.requestedBy,
    otherUserId: input.otherUserId,
    status: "pending",
    requestedAt: new Date().toISOString(),
  };
}
