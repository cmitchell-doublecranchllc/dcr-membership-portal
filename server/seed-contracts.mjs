import { drizzle } from "drizzle-orm/mysql2";
import { contracts } from "../drizzle/schema.ts";
import { eq } from "drizzle-orm";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function seedContracts() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is required");
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL);

  try {
    // Read the Riding Lesson Agreement text
    const agreementText = readFileSync(
      join(__dirname, "contracts", "riding-lesson-agreement.txt"),
      "utf-8"
    );

    // Check if contract already exists
    const existing = await db
      .select()
      .from(contracts)
      .where({ title: "Riding Lesson Agreement" });

    if (existing.length > 0) {
      console.log("✅ Riding Lesson Agreement already exists in database");
      return;
    }

    // Insert the contract
    await db.insert(contracts).values({
      title: "Riding Lesson Agreement",
      description: "Required agreement for all riding lesson students at Double C Ranch LLC",
      googleDocUrl: null,
      googleDocId: null,
      isActive: true,
      requiresSignature: true,
    });

    console.log("✅ Successfully seeded Riding Lesson Agreement contract");
  } catch (error) {
    console.error("❌ Error seeding contracts:", error);
    process.exit(1);
  }

  process.exit(0);
}

seedContracts();
