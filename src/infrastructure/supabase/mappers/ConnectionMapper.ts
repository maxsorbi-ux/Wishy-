/**
 * ConnectionMapper - Converts between Supabase rows and domain Connection
 */

import { Connection, ConnectionType } from "../../../domain";

/**
 * Supabase connections row format
 */
export interface SupabaseConnectionRow {
  id: string;
  user1_id: string;
  user2_id: string;
  type: string;
  status: string;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Convert Supabase row to domain Connection
 */
export function mapSupabaseRowToConnection(row: SupabaseConnectionRow): Connection {
  return {
    id: row.id,
    user1Id: row.user1_id,
    user2Id: row.user2_id,
    type: (row.type as ConnectionType) || "friend",
    status: "accepted", // Supabase only stores accepted connections
    acceptedAt: row.accepted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Convert domain Connection to Supabase row
 */
export function mapConnectionToSupabaseRow(connection: Connection): SupabaseConnectionRow {
  return {
    id: connection.id,
    user1_id: connection.user1Id,
    user2_id: connection.user2Id,
    type: connection.type,
    status: "accepted",
    accepted_at: connection.acceptedAt,
    created_at: connection.createdAt,
    updated_at: connection.updatedAt,
  };
}
