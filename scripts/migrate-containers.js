// Script to create INICIAL movements for existing containers
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Get all containers
  const containers = await prisma.container.findMany();
  
  console.log(`Found ${containers.length} containers`);
  
  for (const container of containers) {
    // Check if there's already an INICIAL movement
    const existingInitial = await prisma.containerMovement.findFirst({
      where: { 
        containerId: container.id,
        type: 'INICIAL'
      }
    });
    
    if (!existingInitial) {
      // Create INICIAL movement
      await prisma.containerMovement.create({
        data: {
          containerId: container.id,
          type: 'INICIAL',
          quantity: container.capacity,
          previousQuantity: 0,
          notes: 'Movimiento inicial migrado'
        }
      });
      console.log(`Created INICIAL movement for container ${container.id}`);
    }
  }
  
  console.log('Migration complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
