const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const permissions = [
    { name: 'VENDOR_CREATE', description: 'Manage child vendors (Create)' },
    { name: 'VENDOR_UPDATE', description: 'Manage child vendors (Edit)' },
    { name: 'VENDOR_DELETE', description: 'Manage child vendors (Delete)' },
    { name: 'VENDOR_VIEW', description: 'View child vendors' },
    { name: 'VEHICLE_CREATE', description: 'Add vehicles' },
    { name: 'VEHICLE_UPDATE', description: 'Edit vehicles' },
    { name: 'VEHICLE_VIEW', description: 'View vehicles' },
    { name: 'DRIVER_CREATE', description: 'Add drivers' },
    { name: 'DRIVER_UPDATE', description: 'Edit drivers' },
    { name: 'DRIVER_VIEW', description: 'View drivers' },
    { name: 'ASSIGN_DRIVERS', description: 'Assign drivers to vehicles' },
    { name: 'DOCUMENT_UPLOAD', description: 'Upload documents' },
    { name: 'DOCUMENT_VERIFY', description: 'Verify documents' },
    { name: 'COMPLIANCE_VIEW', description: 'View compliance' },
    { name: 'BOOKINGS_MANAGE', description: 'Manage bookings/operations' },
    { name: 'REPORTS_VIEW', description: 'View reports' },
    { name: 'DELEGATION_CREATE', description: 'Can delegate permissions' },
    { name: 'DELEGATION_VIEW', description: 'Can view delegations' },
    { name: 'DELEGATION_REVOKE', description: 'Can revoke delegations' }
  ];

  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { name: p.name },
      update: {},
      create: p,
    });
  }

  console.log('Permissions seeded successfully');
}

main().catch(console.error).finally(() => prisma.$disconnect());
