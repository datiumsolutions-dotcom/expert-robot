import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Starting database seed...');

  // Create a default organization for development
  const org = await prisma.organization.upsert({
    where: { slug: 'demo-restaurant' },
    update: {},
    create: {
      name: 'Demo Restaurant',
      slug: 'demo-restaurant',
      status: 'active',
      subscription_plan: 'pro',
    },
  });

  console.log(`✅ Organization created: ${org.name} (${org.id})`);

  // Create a default admin user
  // NOTE: In production this password must be bcrypt-hashed.
  // This is a development seed only.
  const admin = await prisma.adminUser.upsert({
    where: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      organization_id_email: {
        organization_id: org.id,
        email: 'admin@demo.com',
      },
    },
    update: {},
    create: {
      organization_id: org.id,
      email: 'admin@demo.com',
      password_hash: '$2b$12$PLACEHOLDER_HASH_REPLACE_IN_REAL_SEED',
      name: 'Demo Admin',
      role: 'admin',
    },
  });

  console.log(`✅ Admin user created: ${admin.email}`);
  console.log('🌱 Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
