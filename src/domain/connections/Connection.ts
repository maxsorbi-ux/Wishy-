/**
 * Connection - Canonical connection entity
 *
 * A connection represents an accepted relationship between two users.
 * It has a type (friend or relationship) and is always bidirectional.
 */

export type ConnectionType = "friend" | "relationship";
export type ConnectionStatus = "accepted" | "pending";

export interface Connection {
  id: string;
  user1Id: string; // Lower of the two IDs, for consistency
  user2Id: string; // Higher of the two IDs
  type: ConnectionType;
  status: ConnectionStatus;

  // When was the connection established?
  acceptedAt?: string; // ISO timestamp
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/**
 * Normalize user IDs for consistent ordering (lower ID first)
 */
export function normalizeConnectionUsers(userId1: string, userId2: string): [string, string] {
  return userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
}

/**
 * Check if a user is part of this connection
 */
export function isUserInConnection(connection: Connection, userId: string): boolean {
  return connection.user1Id === userId || connection.user2Id === userId;
}

/**
 * Get the other user in a connection
 */
export function getOtherUserInConnection(connection: Connection, userId: string): string | null {
  if (connection.user1Id === userId) return connection.user2Id;
  if (connection.user2Id === userId) return connection.user1Id;
  return null;
}

/**
 * Check if connection is a relationship
 */
export function isRelationshipConnection(connection: Connection): boolean {
  return connection.type === "relationship";
}

/**
 * Create a new connection
 */
export function createConnection(input: {
  user1Id: string;
  user2Id: string;
  type: ConnectionType;
}): Connection {
  const [normalizedUser1, normalizedUser2] = normalizeConnectionUsers(
    input.user1Id,
    input.user2Id
  );
  const now = new Date().toISOString();

  return {
    id: "", // Will be assigned by persistence layer
    user1Id: normalizedUser1,
    user2Id: normalizedUser2,
    type: input.type,
    status: "accepted",
    acceptedAt: now,
    createdAt: now,
    updatedAt: now,
  };
}
