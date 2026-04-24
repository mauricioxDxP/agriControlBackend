// Script to setup terrainId in Field table without migrations
// Run with: node scripts/setupTerrainField.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database setup...\n');

  try {
    // 1. Create Terrain table if not exists
    console.log('1. Creating Terrain table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Terrain" (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        latitude FLOAT,
        longitude FLOAT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        synced BOOLEAN DEFAULT false
      )
    `;
    console.log('   ✓ Terrain table created/verified\n');

    // 2. Create Field table if not exists
    console.log('2. Creating Field table...');
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Field" (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        area FLOAT NOT NULL,
        "terrainId" VARCHAR(255),
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        synced BOOLEAN DEFAULT false
      )
    `;
    console.log('   ✓ Field table created/verified\n');

    // 3. Add terrainId column to Field (if not exists and is nullable)
    console.log('3. Adding terrainId column...');
    await prisma.$executeRaw`
      ALTER TABLE "Field" 
      ADD COLUMN IF NOT EXISTS "terrainId" VARCHAR(255)
    `;
    console.log('   ✓ Column added\n');

    // 4. Create default terrain
    console.log('4. Creating default terrain...');
    const terrainId = require('crypto').randomUUID();
    await prisma.$executeRaw`
      INSERT INTO "Terrain" (id, name, "createdAt", "updatedAt", synced)
      VALUES (${terrainId}, 'Terreno por Defecto', NOW(), NOW(), false)
      ON CONFLICT (id) DO NOTHING
    `;
    console.log(`   ✓ Default terrain created: ${terrainId}\n`);

    // 5. Count fields without terrainId
    console.log('5. Checking fields without terrainId...');
    const fieldsCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "Field" WHERE "terrainId" IS NULL
    `;
    const fieldsWithoutTerrain = Number(fieldsCount[0].count);
    console.log(`   Found ${fieldsWithoutTerrain} fields without terrainId\n`);

    // 6. Assign terrain to fields without one
    if (fieldsWithoutTerrain > 0) {
      console.log('6. Assigning terrain to fields...');
      await prisma.$executeRaw`
        UPDATE "Field" SET "terrainId" = ${terrainId} WHERE "terrainId" IS NULL
      `;
      console.log(`   ✓ Updated ${fieldsWithoutTerrain} fields\n`);
    }

    // 7. Make terrainId NOT NULL
    console.log('7. Setting terrainId as NOT NULL...');
    await prisma.$executeRaw`
      ALTER TABLE "Field" ALTER COLUMN "terrainId" SET NOT NULL
    `;
    console.log('   ✓ Column is now NOT NULL\n');

    // 8. Add foreign key constraint
    console.log('8. Adding foreign key constraint...');
    await prisma.$executeRaw`
      ALTER TABLE "Field" 
      ADD CONSTRAINT "Field_terrainId_fkey" 
      FOREIGN KEY ("terrainId") REFERENCES "Terrain"("id")
    `;
    console.log('   ✓ Foreign key added\n');

    console.log('✅ Database setup completed successfully!');
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
