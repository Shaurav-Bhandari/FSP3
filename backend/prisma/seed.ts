import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create system admin
  const systemAdmin = await prisma.admin.upsert({
    where: { email: 'system@beautysalon.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'system@beautysalon.com',
      passwordHash: await bcrypt.hash('system-admin-password', 10),
      role: 'superadmin',
      isActive: true
    }
  });

  console.log('System admin created:', systemAdmin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 