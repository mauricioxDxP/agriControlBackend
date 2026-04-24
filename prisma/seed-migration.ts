/**
 * Seed Migration Script: refactor-field-to-terrain-planting
 * 
 * This script migrates existing Field data to the new Terreno + Campo + Siembra structure.
 * 
 * For each existing Field:
 * 1. Create a Terreno with the same name, location, latitude, longitude
 * 2. Create a Campo linked to the new Terreno (keeping the same ID)
 * 3. If Field had a productId, create a Siembra with fechaInicio = now()
 * 
 * IMPORTANT: 
 * - Run this AFTER `prisma migrate dev` has created the new schema
 * - Backup your database before running this script
 * - This script modifies existing data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  console.log('🚀 Starting migration: Field → Terreno + Campo + Siembra\n');

  try {
    // Get all existing fields
    const fields = await prisma.field.findMany({
      include: {
        product: true
      }
    });

    console.log(`Found ${fields.length} fields to migrate\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const field of fields) {
      console.log(`Processing field: ${field.name} (${field.id})`);
      
      try {
        // 1. Create Terreno with a NEW UUID (not the same as field)
        const terreno = await prisma.terreno.create({
          data: {
            id: field.id, // Reuse the same ID for the Terreno
            name: field.name,
            location: field.location,
            latitude: field.latitude,
            longitude: field.longitude,
            synced: field.synced
          }
        });
        console.log(`  ✓ Created Terreno: ${terreno.id}`);

        // 2. Create Campo linked to Terreno (keeping the same ID as original Field)
        const campo = await prisma.campo.create({
          data: {
            id: field.id, // Use the same ID to maintain FK relationships with Application/TancadaField
            name: field.name,
            area: field.area,
            terrainId: terreno.id, // Link to new Terreno
            synced: field.synced
          }
        });
        console.log(`  ✓ Created Campo: ${campo.id}`);

        // 3. If Field had a productId, create a Siembra
        if (field.productId && field.product) {
          const siembra = await prisma.siembra.create({
            data: {
              campoId: campo.id,
              productId: field.productId,
              fechaInicio: new Date(),
              notes: `Migrated from Field "${field.name}" (${field.id})`
            }
          });
          console.log(`  ✓ Created Siembra: ${siembra.id} for product "${field.product.name}"`);
        }

        successCount++;
        console.log('');
      } catch (error) {
        errorCount++;
        console.error(`  ✗ Error migrating field ${field.name}:`, error);
        console.log('');
      }
    }

    console.log('═'.repeat(50));
    console.log(`\n✅ Migration complete!`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log('\n📝 Summary:');
    console.log('   - Terreno records created with same IDs as original Fields');
    console.log('   - Campo records created with same IDs as original Fields');
    console.log('   - Applications and TancadaFields still reference campoId (same as old fieldId)');
    console.log('   - Siembra records created for Fields that had productId');
    console.log('\n⚠️  NOTE: The original Field records still exist in the database.');
    console.log('   You may want to run a cleanup script after verifying the migration.');

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrate()
  .then(() => {
    console.log('\nDone.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nMigration failed with error:', error);
    process.exit(1);
  });
