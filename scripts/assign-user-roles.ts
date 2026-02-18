import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignRolesToUser() {
  try {
    const email = 'test@test.com';
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      return;
    }

    console.log(`✅ Found user: ${user.name || user.email} (ID: ${user.id})`);
    console.log(`   Current primary role: ${user.role}`);

    // Check existing roles
    const existingRoles = await prisma.userRole.findMany({
      where: { userId: user.id },
    });

    console.log(`   Existing roles: ${existingRoles.map(r => r.role).join(', ') || 'None'}`);

    // Add ADMIN role if not exists
    const adminRole = await prisma.userRole.upsert({
      where: {
        userId_role: {
          userId: user.id,
          role: 'ADMIN',
        },
      },
      create: {
        userId: user.id,
        role: 'ADMIN',
      },
      update: {},
    });
    console.log(`✅ Added ADMIN role`);

    // Add BUYER role if not exists
    const buyerRole = await prisma.userRole.upsert({
      where: {
        userId_role: {
          userId: user.id,
          role: 'BUYER',
        },
      },
      create: {
        userId: user.id,
        role: 'BUYER',
      },
      update: {},
    });
    console.log(`✅ Added BUYER role`);

    // Update primary role to ADMIN (for backward compatibility)
    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' },
    });
    console.log(`✅ Updated primary role to ADMIN`);

    // Verify final roles
    const finalRoles = await prisma.userRole.findMany({
      where: { userId: user.id },
    });

    console.log(`\n✅ Success! User ${email} now has the following roles:`);
    console.log(`   Primary role: ADMIN`);
    console.log(`   All roles: ${finalRoles.map(r => r.role).join(', ')}`);

  } catch (error: any) {
    console.error('❌ Error assigning roles:', error);
    if (error.code === 'P2002') {
      console.error('   Role already exists for this user');
    } else {
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

assignRolesToUser()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
