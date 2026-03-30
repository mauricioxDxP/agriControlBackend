const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Product Types
  const productTypes = ['SEMILLA', 'FERTILIZANTE', 'PESTICIDA', 'HERBICIDA', 'FUNGICIDA', 'INSECTICIDA', 'OTRO'];
  for (const name of productTypes) {
    await prisma.productType.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }
  console.log('✓ Product Types created');

  // Product States
  const productStates = ['LIQUIDO', 'SOLIDO', 'POLVO', 'GRANULADO', 'GEL'];
  for (const name of productStates) {
    await prisma.productState.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }
  console.log('✓ Product States created');

  // Container Types
  const containerTypes = ['BIDON', 'SACO', 'BOLSA', 'TAMBOR', 'TANQUE', 'OTRO'];
  for (const name of containerTypes) {
    await prisma.containerTypeModel.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }
  console.log('✓ Container Types created');

  console.log('Seeding complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
