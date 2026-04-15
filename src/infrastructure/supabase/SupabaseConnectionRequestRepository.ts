/**
 * SupabaseConnectionRequestRepository - Implements IConnectionRequestRepository
 */

import { ConnectionRequest } from "../../domain";
import { IConnectionRequestRepository } from "../../application/connections/SendConnectionRequest";
import { supabaseDb } from "../../api/supabase";
import {
  mapSupabaseRowToConnectionRequest,
  mapConnectionRequestToSupabaseRow,
  SupabaseConnectionRequestRow,
} from "./mappers";

export class SupabaseConnectionRequestRepository implements IConnectionRequestRepository {
  async save(request: ConnectionRequest): Promise<ConnectionRequest> {
    const row = mapConnectionRequestToSupabaseRow(request);

    try {
      const result = await supabaseDb.insert("connection_requests", row);

      if (result.error) {
        throw new Error(`Failed to save request: ${result.error.message}`);
      }

      return request;
    } catch (error) {
      console.error("SupabaseConnectionRequestRepository.save error:", error);
      throw error;
    }
  }

  async findById(id: string): Promise<ConnectionRequest | null> {
    try {
      const result = await supabaseDb.select("connection_requests", { id });

      if (result.error) {
        throw new Error(`Failed to fetch request: ${result.error.message}`);
      }

      if (!result.data || result.data.length === 0) {
        return null;
      }

      const row = result.data[0] as SupabaseConnectionRequestRow;
      return mapSupabaseRowToConnectionRequest(row);
    } catch (error) {
      console.error("SupabaseConnectionRequestRepository.findById error:", error);
      throw error;
    }
  }

  async findBySenderAndReceiver(
    senderId: string,
    receiverId: string
  ): Promise<ConnectionRequest | null> {
    try {
      const result = await supabaseDb.select("connection_requests", {
        sender_id: senderId,
        receiver_id: receiverId,
        status: "pending",
      });

      if (result.error) {
        throw new Error(`Failed to fetch request: ${result.error.message}`);
      }

      if (!result.data || result.data.length === 0) {
        return null;
      }

      const row = result.data[0] as SupabaseConnectionRequestRow;
      return mapSupabaseRowToConnectionRequest(row);
    } catch (error) {
      console.error("SupabaseConnectionRequestRepository.findBySenderAndReceiver error:", error);
      throw error;
    }
  }

  async update(request: ConnectionRequest): Promise<void> {
    const row = mapConnectionRequestToSupabaseRow(request);

    try {
      const result = await supabaseDb.update("connection_requests", row, { id: request.id });

      if (result.error) {
        throw new Error(`Failed to update request: ${result.error.message}`);
      }
    } catch (error) {
      console.error("SupabaseConnectionRequestRepository.update error:", error);
      throw error;
    }
  }
}
