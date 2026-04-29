const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create a test client
  const client = await prisma.client.upsert({
    where: { slug: 'test-client' },
    update: {},
    create: {
      name: 'Client Test',
      slug: 'test-client',
      hfsql_server: 'localhost',
      hfsql_port: 4900,
      hfsql_db: 'APPLI',
      hfsql_user: 'admin',
      hfsql_password: '',
      agent_token: 'agent_dev_token_12345678901234567890123456',
      active: true,
    },
  });

  console.log(`✅ Created client: ${client.name}`);

  // 2. Create test users
  const hashedPassword = bcrypt.hashSync('password123', 10);

  const workerUser = await prisma.user.upsert({
    where: { client_id_email: { client_id: client.id, email: 'worker@test.com' } },
    update: { team_id: 'team-1' },
    create: {
      email: 'worker@test.com',
      password_hash: hashedPassword,
      name: 'Jean Ouvrier',
      role: 'WORKER',
      client_id: client.id,
      team_id: 'team-1',
      hfsql_id: 1,
    },
  });

  const teamLeadUser = await prisma.user.upsert({
    where: { client_id_email: { client_id: client.id, email: 'chef@test.com' } },
    update: {},
    create: {
      email: 'chef@test.com',
      password_hash: hashedPassword,
      name: 'Pierre Chef',
      role: 'TEAM_LEAD',
      client_id: client.id,
      team_id: 'team-1',
      hfsql_id: 2,
    },
  });

  const hrUser = await prisma.user.upsert({
    where: { client_id_email: { client_id: client.id, email: 'rh@test.com' } },
    update: {},
    create: {
      email: 'rh@test.com',
      password_hash: hashedPassword,
      name: 'Marie RH',
      role: 'HR',
      client_id: client.id,
      hfsql_id: 3,
    },
  });

  console.log(`✅ Created users: ${workerUser.email}, ${teamLeadUser.email}, ${hrUser.email}`);

  // 3. Create test chantiers
  const chantier1 = await prisma.chantier.upsert({
    where: { client_id_code: { client_id: client.id, code: 'CHANT-001' } },
    update: {},
    create: {
      name: 'Chantier A - Rénovation',
      code: 'CHANT-001',
      description: 'Rénovation immeuble Paris',
      client_id: client.id,
      hfsql_id: 101,
      synced_from_hfsql: true,
      active: true,
    },
  });

  const chantier2 = await prisma.chantier.upsert({
    where: { client_id_code: { client_id: client.id, code: 'CHANT-002' } },
    update: {},
    create: {
      name: 'Chantier B - Construction',
      code: 'CHANT-002',
      description: 'Construction nouveau bâtiment',
      client_id: client.id,
      hfsql_id: 102,
      synced_from_hfsql: true,
      active: true,
    },
  });

  console.log(`✅ Created chantiers: ${chantier1.name}, ${chantier2.name}`);

  // 4. Create test heures
  const today = new Date();
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  for (let i = 0; i < 5; i++) {
    const date = new Date(lastWeek.getTime() + i * 24 * 60 * 60 * 1000);
    date.setHours(0, 0, 0, 0);

    await prisma.heure.upsert({
      where: {
        user_id_chantier_id_date: {
          user_id: workerUser.id,
          chantier_id: chantier1.id,
          date,
        },
      },
      update: {},
      create: {
        user_id: workerUser.id,
        client_id: client.id,
        chantier_id: chantier1.id,
        date,
        hours: 8.5,
        type: 'MO',
        status: 'APPROVED',
        synced_to_hfsql: false,
        created_by: teamLeadUser.id,
      },
    });
  }

  console.log(`✅ Created 5 test heures`);

  console.log('✨ Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
