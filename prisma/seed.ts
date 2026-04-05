import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SALT_ROUNDS = 10;

async function hash(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function seed() {
  console.log('🌱 Starting database seed...\n');
  console.log('Creating admin user...');
  const adminPassword = await hash('Admin@123456');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@streetfood.com' },
    update: {},
    create: {
      name: 'Platform Admin',
      email: 'admin@streetfood.com',
      password: adminPassword,
      role: 'admin',
      bio: 'Platform administrator',
    },
    select: { id: true, email: true },
  });
  console.log(`  ✅ Admin: ${admin.email} (id: ${admin.id})`);

  console.log('\nCreating regular users...');
  const userPasswords = await Promise.all([
    hash('User@1234'),
    hash('User@1234'),
    hash('User@1234'),
  ]);

  const usersData = [
    {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      password: userPasswords[0],
      role: 'user',
      bio: 'Street food enthusiast',
    },
    {
      name: 'Bob Smith',
      email: 'bob@example.com',
      password: userPasswords[1],
      role: 'user',
      bio: 'Foodie from downtown',
    },
    {
      name: 'Carol White',
      email: 'carol@example.com',
      password: userPasswords[2],
      role: 'user',
      bio: 'Love discovering new food stalls',
    },
  ];

  const users: { id: string; email: string; name: string }[] = [];
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u,
      select: { id: true, email: true, name: true },
    });
    users.push(user);
    console.log(`  ✅ User: ${user.email}`);
  }

  console.log('\nCreating store owners...');
  const storePasswords = await Promise.all([
    hash('Store@1234'),
    hash('Store@1234'),
  ]);

  const storeUsersData = [
    {
      name: 'Ravi Kumar',
      email: 'ravi@momos.com',
      password: storePasswords[0],
      role: 'store',
      bio: 'Running Momo Corner since 2015',
    },
    {
      name: 'Priya Sharma',
      email: 'priya@chaats.com',
      password: storePasswords[1],
      role: 'store',
      bio: 'Authentic chaat master',
    },
  ];

  const storeOwners: { id: string; email: string; name: string }[] = [];
  for (const u of storeUsersData) {
    const owner = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u,
      select: { id: true, email: true, name: true },
    });
    storeOwners.push(owner);
    console.log(`  ✅ Store Owner: ${owner.email}`);
  }

  console.log('\nCreating stores...');
  await prisma.store.deleteMany({
    where: { owner_id: { in: storeOwners.map((o) => o.id) } },
  });

  const store1 = await prisma.store.create({
    data: {
      owner_id: storeOwners[0].id,
      name: "Ravi's Momo Corner",
      description: 'Steam and fried momos made fresh daily. Best in the city!',
      category: 'Dumplings',
      address: '12 New Baneshwor, Kathmandu',
      latitude: 27.6915,
      longitude: 85.3442,
      status: 'active',
      is_claimed: true,
    },
    select: { id: true, name: true },
  });
  console.log(`  ✅ Store: ${store1.name} (id: ${store1.id})`);

  const store2 = await prisma.store.create({
    data: {
      owner_id: storeOwners[1].id,
      name: "Priya's Chaat Palace",
      description: 'Authentic Indian chaat — pani puri, bhel puri, aloo tikki.',
      category: 'Indian Street Food',
      address: '88 Thamel Marg, Kathmandu',
      latitude: 27.7152,
      longitude: 85.3123,
      status: 'active',
      is_claimed: true,
    },
    select: { id: true, name: true },
  });
  console.log(`  ✅ Store: ${store2.name} (id: ${store2.id})`);

  const stores = [store1, store2];

  // ─── Foods ─────────────────────────────────────────────────────────────────
  console.log('\nAdding food items...');
  const foodsData = [
    // Ravi's Momo Corner
    {
      store_id: stores[0].id,
      name: 'Steam Momo (8 pcs)',
      description: 'Classic steamed dumplings with tomato chutney',
      price: 120,
      is_available: true,
    },
    {
      store_id: stores[0].id,
      name: 'Fried Momo (8 pcs)',
      description: 'Crispy fried dumplings',
      price: 140,
      is_available: true,
    },
    {
      store_id: stores[0].id,
      name: 'C-Momo',
      description: 'Momo cooked in spicy sauce',
      price: 160,
      is_available: true,
    },
    {
      store_id: stores[0].id,
      name: 'Jhol Momo',
      description: 'Momo in rich broth soup',
      price: 150,
      is_available: true,
    },
    // Priya's Chaat Palace
    {
      store_id: stores[1].id,
      name: 'Pani Puri (6 pcs)',
      description: 'Crispy hollow puris with tangy tamarind water',
      price: 50,
      is_available: true,
    },
    {
      store_id: stores[1].id,
      name: 'Bhel Puri',
      description: 'Puffed rice with tangy chutneys',
      price: 60,
      is_available: true,
    },
    {
      store_id: stores[1].id,
      name: 'Aloo Tikki',
      description: 'Crispy potato patties with chole',
      price: 80,
      is_available: true,
    },
    {
      store_id: stores[1].id,
      name: 'Dahi Puri',
      description: 'Puri with sweet yogurt and tamarind',
      price: 70,
      is_available: true,
    },
  ];

  await prisma.food.createMany({ data: foodsData });
  console.log(`  ✅ Added ${foodsData.length} food items`);

  // ─── Reviews ───────────────────────────────────────────────────────────────
  console.log('\nAdding reviews...');
  const reviewsData = [
    {
      user_id: users[0].id,
      store_id: stores[0].id,
      rating: 5,
      comment: 'Absolutely amazing momos! The steam ones are to die for.',
    },
    {
      user_id: users[1].id,
      store_id: stores[0].id,
      rating: 4,
      comment: 'Great food, quick service. Will definitely come back!',
    },
    {
      user_id: users[0].id,
      store_id: stores[1].id,
      rating: 5,
      comment: 'Best pani puri I have ever had. Priya is a legend!',
    },
    {
      user_id: users[2].id,
      store_id: stores[1].id,
      rating: 4,
      comment: 'Loved the bhel puri, very fresh ingredients.',
    },
  ];

  for (const r of reviewsData) {
    await prisma.review.upsert({
      where: { user_id_store_id: { user_id: r.user_id, store_id: r.store_id } },
      update: {},
      create: r,
    });
  }
  console.log(`  ✅ Added ${reviewsData.length} reviews`);

  console.log('\n✅ Seed complete!\n');
  console.log('📋 Test Accounts:');
  console.log('  Admin:        admin@streetfood.com    / Admin@123456');
  console.log('  User 1:       alice@example.com       / User@1234');
  console.log('  User 2:       bob@example.com         / User@1234');
  console.log('  User 3:       carol@example.com       / User@1234');
  console.log('  Store Owner 1: ravi@momos.com         / Store@1234');
  console.log('  Store Owner 2: priya@chaats.com       / Store@1234\n');
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
