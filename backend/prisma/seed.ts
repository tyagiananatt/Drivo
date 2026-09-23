import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const permissions = [
    { name: 'VEHICLE_CREATE', description: 'Can add new vehicles' },
    { name: 'VEHICLE_VIEW', description: 'Can view vehicles' },
    { name: 'VEHICLE_UPDATE', description: 'Can edit vehicles' },
    { name: 'VENDOR_CREATE', description: 'Can add sub-vendors' },
    { name: 'VENDOR_VIEW', description: 'Can view vendors' },
    { name: 'VENDOR_UPDATE', description: 'Can edit vendors' },
    { name: 'VENDOR_DELETE', description: 'Can delete vendors' },
    { name: 'DRIVER_CREATE', description: 'Can add drivers' },
    { name: 'DRIVER_VIEW', description: 'Can view drivers' },
    { name: 'DRIVER_UPDATE', description: 'Can edit drivers' },
    { name: 'COMPLIANCE_VIEW', description: 'Can view compliance reports' },
    { name: 'DOCUMENT_UPLOAD', description: 'Can upload documents' },
    { name: 'DOCUMENT_VIEW', description: 'Can view documents' },
    { name: 'DOCUMENT_VERIFY', description: 'Can verify documents' },
    { name: 'DELEGATION_CREATE', description: 'Can delegate permissions' },
    { name: 'DELEGATION_VIEW', description: 'Can view delegations' },
    { name: 'DELEGATION_REVOKE', description: 'Can revoke delegations' },
    { name: 'ASSIGN_DRIVERS', description: 'Can assign drivers to vehicles' }
  ];

  console.log('Seeding permissions...');
  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { name: p.name },
      update: {},
      create: { name: p.name, description: p.description },
    });
  }
  console.log('Permissions seeded!');

  // Seed default Super Admin role if not exists
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: { name: 'SUPER_ADMIN' }
  });
  
  await prisma.role.upsert({
    where: { name: 'SUPER_VENDOR' },
    update: {},
    create: { name: 'SUPER_VENDOR' }
  });

  // Seed the root super admin user
  const bcrypt = require('bcrypt');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: { password: hashedPassword, roleId: superAdminRole.id },
    create: {
      email: 'admin@gmail.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      roleId: superAdminRole.id,
      vendorId: null
    }
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
