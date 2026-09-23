const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 
async function main() { 
  console.log('Users:', await prisma.user.findMany()); 
  console.log('Vendors:', await prisma.vendor.findMany()); 
} 
main().catch(console.error).finally(() => prisma.$disconnect());
