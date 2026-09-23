const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.driverVehicleAssignment.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.driver.deleteMany({});
  await prisma.delegation.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.vendor.deleteMany({});
  console.log('Database reset successfully. All temporary data removed.');
}
main().catch(console.error).finally(() => prisma.$disconnect());
