/**
 * ConnectionRequestMapper - Converts between Supabase rows and domain entities
 */

import { ConnectionRequest, createConnectionRequest } from "../../../domain";

export interface SupabaseConnectionRequestRow {
  id: string;
  sender_id: string;
  receiver_id: string;
  message?: string | null;
  status: "pending" | "accepted" | "rejected";
  sent_at: string;
  responded_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export function mapSupabaseRowToConnectionRequest(
  row: SupabaseConnectionRequestRow
): ConnectionRequest {
  return {
    id: row.id,
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    message: row.message || undefined,
    status: row.status,
    sentAt: row.sent_at,
    respondedAt: row.responded_at || undefined,
  };
}

export function mapConnectionRequestToSupabaseRow(
  request: ConnectionRequest
): SupabaseConnectionRequestRow {
  return {
    id: request.id,
    sender_id: request.senderId,
    receiver_id: request.receiverId,
    message: request.message || null,
    status: request.status,
    sent_at: request.sentAt,
    responded_at: request.respondedAt || null,
  };
}
