const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.subscriptionPlan.updateMany({
    data: { 
      limits: { maxUsers: 100, maxBranches: 10, maxMechanics: 100, storageGB: 100 } 
    }
  });
  console.log('Limits updated');
}
main().catch(console.error).finally(() => prisma.$disconnect());
