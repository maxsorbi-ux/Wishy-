/**
 * SupabaseConnectionRepository - Implements IConnectionRepository
 */

import { Connection } from "../../domain";
import { IConnectionRepository } from "../../application/connections/AcceptConnectionRequest";
import { supabaseDb } from "../../api/supabase";
import {
  mapSupabaseRowToConnection,
  mapConnectionToSupabaseRow,
  SupabaseConnectionRow,
  mapSupabaseRowToConnectionRequest,
} from "./mappers";
import { normalizeConnectionUsers } from "../../domain";

export class SupabaseConnectionRepository implements IConnectionRepository {
  async save(connection: Connection): Promise<Connection> {
    const row = mapConnectionToSupabaseRow(connection);

    try {
      const result = await supabaseDb.insert("connections", row);

      if (result.error) {
        throw new Error(`Failed to save connection: ${result.error.message}`);
      }

      return connection;
    } catch (error) {
      console.error("SupabaseConnectionRepository.save error:", error);
      throw error;
    }
  }

  async findById(id: string): Promise<Connection | null> {
    try {
      const result = await supabaseDb.select("connections", { id });

      if (result.error) {
        throw new Error(`Failed to fetch connection: ${result.error.message}`);
      }

      if (!result.data || result.data.length === 0) {
        return null;
      }

      const row = result.data[0] as SupabaseConnectionRow;
      return mapSupabaseRowToConnection(row);
    } catch (error) {
      console.error("SupabaseConnectionRepository.findById error:", error);
      throw error;
    }
  }

  async findByUserPair(user1Id: string, user2Id: string): Promise<Connection | null> {
    // Normalize user IDs for consistent ordering
    const [normalizedUser1, normalizedUser2] = normalizeConnectionUsers(user1Id, user2Id);

    try {
      const result = await supabaseDb.select("connections", {
        user1_id: normalizedUser1,
        user2_id: normalizedUser2,
      });

      if (result.error) {
        throw new Error(`Failed to fetch connection: ${result.error.message}`);
      }

      if (!result.data || result.data.length === 0) {
        return null;
      }

      const row = result.data[0] as SupabaseConnectionRow;
      return mapSupabaseRowToConnection(row);
    } catch (error) {
      console.error("SupabaseConnectionRepository.findByUserPair error:", error);
      throw error;
    }
  }

  async findByUserId(userId: string): Promise<Connection[]> {
    try {
      const result1 = await supabaseDb.select("connections", { user1_id: userId });
      const result2 = await supabaseDb.select("connections", { user2_id: userId });
      const connections: Connection[] = [];

      if (result1.data && Array.isArray(result1.data)) {
        connections.push(
          ...result1.data.map((row: any) => mapSupabaseRowToConnection(row as SupabaseConnectionRow))
        );
      }
      if (result2.data && Array.isArray(result2.data)) {
        connections.push(
          ...result2.data.map((row: any) => mapSupabaseRowToConnection(row as SupabaseConnectionRow))
        );
      }

      // Deduplicate by id
      const seen = new Set<string>();
      return connections.filter((c) => {
        if (seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
      });
    } catch (error) {
      console.error("SupabaseConnectionRepository.findByUserId error:", error);
      throw error;
    }
  }

  async findBetweenUsers(user1Id: string, user2Id: string): Promise<Connection | null> {
    return this.findByUserPair(user1Id, user2Id);
  }

  async findPendingRequestsForUser(userId: string): Promise<any[]> {
    try {
      const result = await supabaseDb.select("connection_requests", {
        receiver_id: userId,
        status: "pending",
      });

      if (!result.data || !Array.isArray(result.data)) {
        return [];
      }

      return result.data.map((row: any) => mapSupabaseRowToConnectionRequest(row));
    } catch (error) {
      console.error("SupabaseConnectionRepository.findPendingRequestsForUser error:", error);
      throw error;
    }
  }

  async findPendingUpgradeRequest(user1Id: string, user2Id: string): Promise<any | null> {
    // Upgrade requests not yet implemented in persistence
    return null;
  }
}
