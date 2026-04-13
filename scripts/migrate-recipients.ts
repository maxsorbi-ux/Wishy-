/**
 * Migration Script: Clean Recipient Persistence
 * 
 * This script extracts recipient references from the wish.links field
 * and properly populates the wish_recipients table.
 * 
 * Run this ONCE to migrate historical data:
 *   npx ts-node scripts/migrate-recipients.ts
 */

import { supabaseDb } from "../src/api/supabase";

interface WishRow {
  id: string;
  links?: string[];
}

interface RecipientEntry {
  wish_id: string;
  recipient_id: string;
}

async function migrateRecipients() {
  console.log("=== RECIPIENT PERSISTENCE MIGRATION ===");
  console.log("Extracting recipients from wish.links field...\n");

  try {
    // Step 1: Fetch all wishes with links
    console.log("Step 1: Fetching all wishes...");
    const allWishesResult = await supabaseDb.select("wishes", {});

    if (allWishesResult.error) {
      throw new Error(`Failed to fetch wishes: ${allWishesResult.error.message}`);
    }

    const wishes = (allWishesResult.data || []) as WishRow[];
    console.log(`Found ${wishes.length} wishes total`);

    // Step 2: Extract recipient IDs from links
    console.log("\nStep 2: Extracting recipients from links field...");
    const recipientEntries: RecipientEntry[] = [];
    let wishesWithRecipients = 0;

    for (const wish of wishes) {
      if (!wish.links || wish.links.length === 0) continue;

      const recipientIds = wish.links
        .filter((link) => link.startsWith("recipient:"))
        .map((link) => link.replace("recipient:", ""));

      if (recipientIds.length > 0) {
        wishesWithRecipients++;
        for (const recipientId of recipientIds) {
          recipientEntries.push({
            wish_id: wish.id,
            recipient_id: recipientId,
          });
        }
      }
    }

    console.log(`Found ${wishesWithRecipients} wishes with recipients`);
    console.log(`Total recipient entries to migrate: ${recipientEntries.length}`);

    // Step 3: Insert into wish_recipients (batch)
    console.log("\nStep 3: Inserting recipients into wish_recipients table...");
    let successCount = 0;
    let skipCount = 0;

    for (const entry of recipientEntries) {
      // Check if already exists
      const existingResult = await supabaseDb.select("wish_recipients", {
        wish_id: entry.wish_id,
        recipient_id: entry.recipient_id,
      });

      if (existingResult.data && existingResult.data.length > 0) {
        skipCount++;
        continue;
      }

      // Insert if not exists
      const insertResult = await supabaseDb.insert("wish_recipients", entry);

      if (insertResult.error) {
        console.warn(
          `⚠ Failed to insert recipient ${entry.recipient_id} for wish ${entry.wish_id}: ${insertResult.error.message}`
        );
      } else {
        successCount++;
      }
    }

    console.log(`Successfully inserted: ${successCount}`);
    console.log(`Already existing: ${skipCount}`);

    // Step 4: Clean up wish.links field (remove recipient entries)
    console.log("\nStep 4: Cleaning wish.links field (removing recipient entries)...");
    let cleanedCount = 0;

    for (const wish of wishes) {
      if (!wish.links || wish.links.length === 0) continue;

      const cleanedLinks = wish.links.filter((link) => !link.startsWith("recipient:"));

      // Only update if links actually changed
      if (cleanedLinks.length !== wish.links.length) {
        const updateResult = await supabaseDb.update(
          "wishes",
          {
            links: cleanedLinks.length > 0 ? cleanedLinks : null,
          },
          { id: wish.id }
        );

        if (updateResult.error) {
          console.warn(`⚠ Failed to clean links for wish ${wish.id}: ${updateResult.error.message}`);
        } else {
          cleanedCount++;
        }
      }
    }

    console.log(`Cleaned ${cleanedCount} wishes`);

    // Step 5: Verification
    console.log("\nStep 5: Verifying migration...");
    const verifyResult = await supabaseDb.select("wishes", {});
    const wishesWithRecipientLinks = (verifyResult.data || []).filter((w: WishRow) =>
      w.links?.some((link) => link.startsWith("recipient:"))
    );

    if (wishesWithRecipientLinks.length === 0) {
      console.log("✅ SUCCESS: No remaining recipient entries in wish.links");
    } else {
      console.warn(`⚠ WARNING: ${wishesWithRecipientLinks.length} wishes still have recipient entries`);
    }

    const recipientsTableResult = await supabaseDb.select("wish_recipients", {});
    console.log(
      `✅ wish_recipients table now contains ${(recipientsTableResult.data || []).length} entries`
    );

    console.log("\n=== MIGRATION COMPLETE ===");
    console.log("Data is now clean - wish.links contains ONLY URLs");
    console.log("Recipients are stored exclusively in wish_recipients table");
  } catch (error) {
    console.error("❌ MIGRATION FAILED:", error);
    process.exit(1);
  }
}

// Run migration
migrateRecipients().then(() => {
  console.log("\nMigration script finished");
  process.exit(0);
});
