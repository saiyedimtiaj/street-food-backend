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

  // ═══════════════════════════════════════════════════════════════════════════
  // CLEAN UP — delete in order respecting FK constraints
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('🗑️  Cleaning existing data...');
  await prisma.reviewReply.deleteMany();
  await prisma.reviewImage.deleteMany();
  await prisma.review.deleteMany();
  await prisma.food.deleteMany();
  await prisma.storeGallery.deleteMany();
  await prisma.storeComplaint.deleteMany();
  await prisma.storeClaim.deleteMany();
  await prisma.storeSuggestion.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();
  console.log('  ✅ Cleaned all tables\n');

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN USERS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('👑 Creating admin users...');
  const adminPw = await hash('Admin@123456');
  const admin = await prisma.user.create({
    data: {
      name: 'Platform Admin',
      email: 'admin@streetfood.com',
      password: adminPw,
      role: 'admin',
      bio: 'Platform administrator — managing street food reviews.',
    },
  });
  const admin2 = await prisma.user.create({
    data: {
      name: 'Sita Moderator',
      email: 'sita.mod@streetfood.com',
      password: adminPw,
      role: 'admin',
      bio: 'Content moderator for the platform.',
    },
  });
  console.log(`  ✅ ${admin.name} (${admin.email})`);
  console.log(`  ✅ ${admin2.name} (${admin2.email})`);

  // ═══════════════════════════════════════════════════════════════════════════
  // REGULAR USERS (15 users)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n👤 Creating regular users...');
  const userPw = await hash('User@1234');
  const usersData = [
    {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      bio: 'Street food enthusiast from Kathmandu',
    },
    {
      name: 'Bob Smith',
      email: 'bob@example.com',
      bio: 'Foodie from downtown Patan',
    },
    {
      name: 'Carol White',
      email: 'carol@example.com',
      bio: 'Love discovering new food stalls',
    },
    {
      name: 'David Tamang',
      email: 'david.tamang@example.com',
      bio: 'Momo lover, always on the hunt',
    },
    {
      name: 'Eva Shrestha',
      email: 'eva.shrestha@example.com',
      bio: 'Food blogger and reviewer',
    },
    {
      name: 'Farhan Ali',
      email: 'farhan.ali@example.com',
      bio: 'Lives for chaat and samosas',
    },
    {
      name: 'Grace Gurung',
      email: 'grace.gurung@example.com',
      bio: 'Street food photographer',
    },
    {
      name: 'Hari Bahadur',
      email: 'hari.bahadur@example.com',
      bio: 'Always looking for the best sekuwa',
    },
    {
      name: 'Isha Rai',
      email: 'isha.rai@example.com',
      bio: 'Tea and chatpate connoisseur',
    },
    {
      name: 'Jay Adhikari',
      email: 'jay.adhikari@example.com',
      bio: 'Exploring Kathmandu one stall at a time',
    },
    {
      name: 'Kabita Thapa',
      email: 'kabita.thapa@example.com',
      bio: 'Samosa queen',
    },
    {
      name: 'Laxmi Maharjan',
      email: 'laxmi.maharjan@example.com',
      bio: 'Newari food fanatic',
    },
    {
      name: 'Milan Karki',
      email: 'milan.karki@example.com',
      bio: 'Bhaktapur foodie',
    },
    {
      name: 'Nisha Pandey',
      email: 'nisha.pandey@example.com',
      bio: 'Weekend food explorer',
    },
    {
      name: 'Om Basnet',
      email: 'om.basnet@example.com',
      bio: 'Rating every momo stall in Nepal',
    },
  ];

  const users: { id: string; name: string; email: string }[] = [];
  for (const u of usersData) {
    const user = await prisma.user.create({
      data: { ...u, password: userPw, role: 'user' },
      select: { id: true, name: true, email: true },
    });
    users.push(user);
    console.log(`  ✅ ${user.name}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STORE OWNERS (8 owners)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n🏪 Creating store owners...');
  const storePw = await hash('Store@1234');
  const ownersData = [
    {
      name: 'Ravi Kumar',
      email: 'ravi@momos.com',
      bio: 'Running Momo Corner since 2015',
    },
    {
      name: 'Priya Sharma',
      email: 'priya@chaats.com',
      bio: 'Authentic chaat master',
    },
    {
      name: 'Sunil Maharjan',
      email: 'sunil@newari.com',
      bio: 'Newari cuisine specialist',
    },
    {
      name: 'Anita Rai',
      email: 'anita@sekuwa.com',
      bio: 'Best sekuwa in Patan',
    },
    {
      name: 'Bikash Lama',
      email: 'bikash@thukpa.com',
      bio: 'Thukpa and noodle expert',
    },
    {
      name: 'Deepa KC',
      email: 'deepa@chatpate.com',
      bio: 'Chatpate queen since 2018',
    },
    {
      name: 'Gopal Shrestha',
      email: 'gopal@samosa.com',
      bio: 'Famous samosa wala of Thamel',
    },
    {
      name: 'Maya Tamang',
      email: 'maya@tea.com',
      bio: 'Tea and snacks corner owner',
    },
  ];

  const owners: { id: string; name: string; email: string }[] = [];
  for (const o of ownersData) {
    const owner = await prisma.user.create({
      data: { ...o, password: storePw, role: 'store' },
      select: { id: true, name: true, email: true },
    });
    owners.push(owner);
    console.log(`  ✅ ${owner.name}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STORES (12 stores — 8 claimed by owners + 4 unclaimed)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n🏬 Creating stores...');
  const storesData = [
    // ── Claimed stores (within 50km of 22.3565, 91.8199 — Chittagong) ──
    {
      owner_id: owners[0].id,
      name: "Ravi's Fuchka House",
      description:
        'Crispy fuchka with tangy tamarind water. Best in Chittagong city!',
      category: 'Snacks',
      address: 'GEC Circle, Chittagong',
      latitude: 22.3569,
      longitude: 91.823,
      status: 'active',
      is_claimed: true,
    },
    {
      owner_id: owners[1].id,
      name: "Priya's Chaat Palace",
      description:
        'Authentic chaat — pani puri, bhel puri, aloo tikki and more.',
      category: 'Chaat & Snacks',
      address: 'Agrabad Commercial Area, Chittagong',
      latitude: 22.3265,
      longitude: 91.8105,
      status: 'active',
      is_claimed: true,
    },
    {
      owner_id: owners[2].id,
      name: "Sunil's Kacchi Ghor",
      description:
        'Famous Chittagong kacchi biriyani and tehari. Cooked in clay pots.',
      category: 'Biriyani',
      address: 'Anderkilla, Chittagong',
      latitude: 22.3412,
      longitude: 91.8345,
      status: 'active',
      is_claimed: true,
    },
    {
      owner_id: owners[3].id,
      name: "Anita's Shutki Corner",
      description:
        'Dried fish delicacies — shutki bhorta, shutki curry, traditional Chittagong style.',
      category: 'Seafood',
      address: 'Chawkbazar, Chittagong',
      latitude: 22.348,
      longitude: 91.832,
      status: 'active',
      is_claimed: true,
    },
    {
      owner_id: owners[4].id,
      name: "Bikash's Jhalmuri Stall",
      description:
        'Spicy jhalmuri, chanachur, and masala peanuts. Roadside favorite.',
      category: 'Street Snacks',
      address: 'CRB Area, Chittagong',
      latitude: 22.361,
      longitude: 91.815,
      status: 'active',
      is_claimed: true,
    },
    {
      owner_id: owners[5].id,
      name: "Deepa's Chotpoti Corner",
      description:
        'Chotpoti, dahi puri, and aloo dum made to order. Always fresh.',
      category: 'Snacks',
      address: 'Nasirabad, Chittagong',
      latitude: 22.3715,
      longitude: 91.8085,
      status: 'active',
      is_claimed: true,
    },
    {
      owner_id: owners[6].id,
      name: "Gopal's Singara & Samosa",
      description:
        'Crispy singara and samosa with neem pata chutney. Hot and fresh every hour.',
      category: 'Snacks',
      address: 'New Market, Chittagong',
      latitude: 22.353,
      longitude: 91.828,
      status: 'active',
      is_claimed: true,
    },
    {
      owner_id: owners[7].id,
      name: "Maya's Cha & Nasta",
      description:
        'Layered tea, biscuit, and evening nasta. The cozy neighborhood stop.',
      category: 'Tea & Beverages',
      address: 'Patenga Road, Chittagong',
      latitude: 22.251,
      longitude: 91.792,
      status: 'active',
      is_claimed: true,
    },
    // ── Unclaimed stores ──
    {
      owner_id: null,
      name: 'Halishahar Doi Stall',
      description:
        'Famous Chittagong mishti doi and borhani. Sweet, creamy, unforgettable.',
      category: 'Desserts',
      address: 'Halishahar, Chittagong',
      latitude: 22.318,
      longitude: 91.785,
      status: 'active',
      is_claimed: false,
    },
    {
      owner_id: null,
      name: 'Khatunganj Lassi Stall',
      description: 'Thick lassi and borhani near Khatunganj wholesale market.',
      category: 'Beverages',
      address: 'Khatunganj, Chittagong',
      latitude: 22.335,
      longitude: 91.84,
      status: 'active',
      is_claimed: false,
    },
    {
      owner_id: null,
      name: 'Sitakunda Pitha House',
      description:
        'Traditional pitha — bhapa pitha, chitoi, patishapta. Fresh every morning.',
      category: 'Traditional',
      address: 'Sitakunda, Chittagong',
      latitude: 22.6155,
      longitude: 91.6613,
      status: 'active',
      is_claimed: false,
    },
    {
      owner_id: null,
      name: 'Mirsharai Fish BBQ',
      description:
        'Grilled sea fish and lobster on the beach. Smoky and delicious.',
      category: 'Seafood BBQ',
      address: 'Mirsharai Beach, Chittagong',
      latitude: 22.765,
      longitude: 91.567,
      status: 'active',
      is_claimed: false,
    },
  ];

  const stores: { id: string; name: string }[] = [];
  for (const s of storesData) {
    const store = await prisma.store.create({
      data: s,
      select: { id: true, name: true },
    });
    stores.push(store);
    console.log(`  ✅ ${store.name}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FOODS (6-8 items per store = ~80 items)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n🍜 Adding food items...');
  const foodsData = [
    // Store 0: Ravi's Fuchka House
    {
      store_id: stores[0].id,
      name: 'Fuchka (8 pcs)',
      description:
        'Crispy hollow puris with tangy tamarind water and mashed potato',
      price: 30,
      is_available: true,
    },
    {
      store_id: stores[0].id,
      name: 'Doi Fuchka (8 pcs)',
      description: 'Fuchka topped with sweet yogurt and tamarind',
      price: 40,
      is_available: true,
    },
    {
      store_id: stores[0].id,
      name: 'Aloor Dum',
      description: 'Spiced potato curry served with puri',
      price: 25,
      is_available: true,
    },
    {
      store_id: stores[0].id,
      name: 'Chotpoti',
      description: 'Spiced chickpea mix with tamarind and chili',
      price: 30,
      is_available: true,
    },
    {
      store_id: stores[0].id,
      name: 'Papri Chaat',
      description: 'Crispy papri with yogurt, chutney, and sev',
      price: 35,
      is_available: true,
    },
    {
      store_id: stores[0].id,
      name: 'Dahi Bora',
      description: 'Fried lentil balls soaked in spiced yogurt',
      price: 30,
      is_available: true,
    },
    {
      store_id: stores[0].id,
      name: 'Chanachur Mix',
      description: 'Spicy puffed rice mix with onion, chili, and lemon',
      price: 15,
      is_available: true,
    },

    // Store 1: Priya's Chaat Palace
    {
      store_id: stores[1].id,
      name: 'Pani Puri (6 pcs)',
      description: 'Crispy hollow puris with tangy mint water',
      price: 25,
      is_available: true,
    },
    {
      store_id: stores[1].id,
      name: 'Bhel Puri',
      description: 'Puffed rice with tangy chutneys and sev',
      price: 30,
      is_available: true,
    },
    {
      store_id: stores[1].id,
      name: 'Aloo Tikki',
      description: 'Crispy potato patties with chole and chutney',
      price: 40,
      is_available: true,
    },
    {
      store_id: stores[1].id,
      name: 'Dahi Puri',
      description: 'Puri topped with sweet yogurt and tamarind',
      price: 35,
      is_available: true,
    },
    {
      store_id: stores[1].id,
      name: 'Sev Puri',
      description: 'Flat puris with sev, onion, and green chutney',
      price: 30,
      is_available: true,
    },
    {
      store_id: stores[1].id,
      name: 'Papdi Chaat',
      description: 'Crispy papdi with chana, curd, and chutneys',
      price: 45,
      is_available: true,
    },
    {
      store_id: stores[1].id,
      name: 'Samosa Chaat',
      description: 'Crushed samosa with chole and tangy chutneys',
      price: 50,
      is_available: true,
    },

    // Store 2: Sunil's Kacchi Ghor
    {
      store_id: stores[2].id,
      name: 'Kacchi Biriyani',
      description:
        'Chittagong-style kacchi with aromatic rice and tender mutton',
      price: 200,
      is_available: true,
    },
    {
      store_id: stores[2].id,
      name: 'Tehari',
      description: 'Spiced beef tehari cooked in mustard oil',
      price: 120,
      is_available: true,
    },
    {
      store_id: stores[2].id,
      name: 'Chicken Biriyani',
      description: 'Fragrant chicken biriyani with raita',
      price: 150,
      is_available: true,
    },
    {
      store_id: stores[2].id,
      name: 'Borhani',
      description: 'Spiced yogurt drink, perfect with biriyani',
      price: 30,
      is_available: true,
    },
    {
      store_id: stores[2].id,
      name: 'Mutton Rezala',
      description: 'Creamy spiced mutton curry',
      price: 180,
      is_available: true,
    },
    {
      store_id: stores[2].id,
      name: 'Jali Kabab',
      description: 'Minced meat patty, crispy outside, juicy inside',
      price: 40,
      is_available: true,
    },

    // Store 3: Anita's Shutki Corner
    {
      store_id: stores[3].id,
      name: 'Shutki Bhorta',
      description: 'Mashed dried fish with chili, onion, and mustard oil',
      price: 60,
      is_available: true,
    },
    {
      store_id: stores[3].id,
      name: 'Shutki Shira',
      description: 'Dried fish cooked in spicy gravy',
      price: 80,
      is_available: true,
    },
    {
      store_id: stores[3].id,
      name: 'Loitta Shutki Fry',
      description: 'Crispy fried Bombay duck dried fish',
      price: 70,
      is_available: true,
    },
    {
      store_id: stores[3].id,
      name: 'Chingri Bhorta',
      description: 'Mashed dried shrimp with green chili',
      price: 90,
      is_available: true,
    },
    {
      store_id: stores[3].id,
      name: 'Shutki Vorta Platter',
      description: 'Assorted bhorta platter with rice',
      price: 150,
      is_available: true,
    },
    {
      store_id: stores[3].id,
      name: 'Hilsha Fish Fry',
      description: 'Fried hilsha marinated in turmeric and salt',
      price: 200,
      is_available: true,
    },

    // Store 4: Bikash's Jhalmuri Stall
    {
      store_id: stores[4].id,
      name: 'Jhalmuri',
      description:
        'Spicy puffed rice with mustard oil, onion, chili, and lemon',
      price: 15,
      is_available: true,
    },
    {
      store_id: stores[4].id,
      name: 'Masala Muri',
      description: 'Puffed rice tossed with spices and peanuts',
      price: 10,
      is_available: true,
    },
    {
      store_id: stores[4].id,
      name: 'Chanachur',
      description: 'Crunchy spiced mixture with chickpeas',
      price: 20,
      is_available: true,
    },
    {
      store_id: stores[4].id,
      name: 'Masala Badam',
      description: 'Roasted peanuts with chili and salt',
      price: 15,
      is_available: true,
    },
    {
      store_id: stores[4].id,
      name: 'Makka Bhutta (Corn)',
      description: 'Roasted corn on the cob with lime and chili',
      price: 20,
      is_available: true,
    },
    {
      store_id: stores[4].id,
      name: 'Tok Doi Muri',
      description: 'Puffed rice with sour yogurt and jaggery',
      price: 25,
      is_available: true,
    },

    // Store 5: Deepa's Chotpoti Corner
    {
      store_id: stores[5].id,
      name: 'Chotpoti',
      description: 'Spiced chickpea mix with tamarind and chili',
      price: 25,
      is_available: true,
    },
    {
      store_id: stores[5].id,
      name: 'Fuchka (8 pcs)',
      description: 'Crunchy puris with spiced water filling',
      price: 30,
      is_available: true,
    },
    {
      store_id: stores[5].id,
      name: 'Aloo Dum',
      description: 'Spiced potato curry served with puri',
      price: 30,
      is_available: true,
    },
    {
      store_id: stores[5].id,
      name: 'Dahi Puri',
      description: 'Crispy puri with yogurt toppings',
      price: 35,
      is_available: true,
    },
    {
      store_id: stores[5].id,
      name: 'Fruit Chaat',
      description: 'Seasonal fruits with chaat masala and lime',
      price: 40,
      is_available: true,
    },
    {
      store_id: stores[5].id,
      name: 'Halim',
      description: 'Slow-cooked wheat and meat porridge',
      price: 50,
      is_available: true,
    },

    // Store 6: Gopal's Singara & Samosa
    {
      store_id: stores[6].id,
      name: 'Singara (2 pcs)',
      description: 'Classic Bengali potato singara, crispy shell',
      price: 15,
      is_available: true,
    },
    {
      store_id: stores[6].id,
      name: 'Samosa (2 pcs)',
      description: 'Minced meat filled samosa, spiced and fried',
      price: 20,
      is_available: true,
    },
    {
      store_id: stores[6].id,
      name: 'Piaju (4 pcs)',
      description: 'Onion fritters, crispy and golden',
      price: 15,
      is_available: true,
    },
    {
      store_id: stores[6].id,
      name: 'Beguni (4 pcs)',
      description: 'Brinjal fritters in gram flour batter',
      price: 15,
      is_available: true,
    },
    {
      store_id: stores[6].id,
      name: 'Puri (4 pcs)',
      description: 'Deep fried puffed bread',
      price: 20,
      is_available: true,
    },
    {
      store_id: stores[6].id,
      name: 'Aloo Chop (2 pcs)',
      description: 'Potato croquettes coated in egg and crumbs',
      price: 20,
      is_available: true,
    },

    // Store 7: Maya's Cha & Nasta
    {
      store_id: stores[7].id,
      name: 'Layered Cha',
      description: 'Chittagong famous 7-layer tea',
      price: 30,
      is_available: true,
    },
    {
      store_id: stores[7].id,
      name: 'Doodh Cha',
      description: 'Sweet milk tea, strong and creamy',
      price: 15,
      is_available: true,
    },
    {
      store_id: stores[7].id,
      name: 'Lal Cha',
      description: 'Red tea with lime, no milk',
      price: 10,
      is_available: true,
    },
    {
      store_id: stores[7].id,
      name: 'Toast & Butter',
      description: 'Toasted bread with butter',
      price: 20,
      is_available: true,
    },
    {
      store_id: stores[7].id,
      name: 'Bun-Kabab',
      description: 'Soft bun with spiced kabab patty',
      price: 30,
      is_available: true,
    },
    {
      store_id: stores[7].id,
      name: 'Paratha with Egg',
      description: 'Flaky paratha with fried egg and dal',
      price: 40,
      is_available: true,
    },

    // Store 8: Halishahar Doi Stall
    {
      store_id: stores[8].id,
      name: 'Mishti Doi (Small)',
      description: 'Sweet set yogurt in clay pot',
      price: 30,
      is_available: true,
    },
    {
      store_id: stores[8].id,
      name: 'Mishti Doi (Large)',
      description: 'Sweet set yogurt in large clay pot',
      price: 60,
      is_available: true,
    },
    {
      store_id: stores[8].id,
      name: 'Borhani',
      description: 'Spiced yogurt drink with mint',
      price: 25,
      is_available: true,
    },
    {
      store_id: stores[8].id,
      name: 'Lassi',
      description: 'Thick sweet yogurt drink',
      price: 30,
      is_available: true,
    },

    // Store 9: Khatunganj Lassi Stall
    {
      store_id: stores[9].id,
      name: 'Plain Lassi',
      description: 'Traditional thick yogurt drink',
      price: 25,
      is_available: true,
    },
    {
      store_id: stores[9].id,
      name: 'Mango Lassi',
      description: 'Lassi blended with fresh mango pulp',
      price: 40,
      is_available: true,
    },
    {
      store_id: stores[9].id,
      name: 'Banana Shake',
      description: 'Thick banana milkshake',
      price: 35,
      is_available: true,
    },
    {
      store_id: stores[9].id,
      name: 'Borhani Special',
      description: 'Extra spiced yogurt drink with black pepper',
      price: 30,
      is_available: true,
    },

    // Store 10: Sitakunda Pitha House
    {
      store_id: stores[10].id,
      name: 'Bhapa Pitha',
      description: 'Steamed rice cake with coconut and jaggery filling',
      price: 20,
      is_available: true,
    },
    {
      store_id: stores[10].id,
      name: 'Chitoi Pitha',
      description: 'Thin rice pancake, soft and steamy',
      price: 15,
      is_available: true,
    },
    {
      store_id: stores[10].id,
      name: 'Patishapta',
      description: 'Rice crepe rolled with kheer filling',
      price: 25,
      is_available: true,
    },
    {
      store_id: stores[10].id,
      name: 'Puli Pitha',
      description: 'Crescent shaped dumpling with coconut filling',
      price: 20,
      is_available: true,
    },

    // Store 11: Mirsharai Fish BBQ
    {
      store_id: stores[11].id,
      name: 'Grilled Rupchanda',
      description: 'Whole pomfret grilled with salt and chili',
      price: 200,
      is_available: true,
    },
    {
      store_id: stores[11].id,
      name: 'Grilled Chingri',
      description: 'Large prawns grilled on charcoal',
      price: 300,
      is_available: true,
    },
    {
      store_id: stores[11].id,
      name: 'Fish Fry (Vetki)',
      description: 'Crispy fried barramundi',
      price: 250,
      is_available: true,
    },
    {
      store_id: stores[11].id,
      name: 'Lobster BBQ',
      description: 'Fresh lobster grilled with garlic butter',
      price: 500,
      is_available: true,
    },
    {
      store_id: stores[11].id,
      name: 'Shutki Bhorta Plate',
      description: 'Dried fish mash with rice and dal',
      price: 120,
      is_available: true,
    },
  ];

  await prisma.food.createMany({ data: foodsData });
  console.log(
    `  ✅ Added ${foodsData.length} food items across ${stores.length} stores`,
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // REVIEWS (~43 reviews spread across all 12 stores)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n⭐ Adding reviews...');

  const reviewsData: {
    user_id: string;
    store_id: string;
    rating: number;
    comment: string;
  }[] = [
    // Store 0: Ravi's Fuchka House
    {
      user_id: users[0].id,
      store_id: stores[0].id,
      rating: 5,
      comment:
        'Best fuchka in GEC area! Perfectly crispy shells and the tamarind water is spot on.',
    },
    {
      user_id: users[1].id,
      store_id: stores[0].id,
      rating: 4,
      comment:
        'Great fuchka, quick service. The doi fuchka is a must-try. Will come back!',
    },
    {
      user_id: users[2].id,
      store_id: stores[0].id,
      rating: 5,
      comment:
        'Chotpoti here is incredible. Perfect balance of spice and tang. 10/10.',
    },
    {
      user_id: users[3].id,
      store_id: stores[0].id,
      rating: 4,
      comment:
        'Solid fuchka, slightly crowded in the evening. Chanachur mix is addictive.',
    },
    {
      user_id: users[4].id,
      store_id: stores[0].id,
      rating: 5,
      comment:
        'Been coming here for years. Best street food stall at GEC Circle.',
    },

    // Store 1: Priya's Chaat Palace
    {
      user_id: users[0].id,
      store_id: stores[1].id,
      rating: 5,
      comment: 'Best pani puri in Agrabad! The mint water is so refreshing.',
    },
    {
      user_id: users[5].id,
      store_id: stores[1].id,
      rating: 4,
      comment:
        'Papdi chaat was fresh and flavorful. Good portions for the price.',
    },
    {
      user_id: users[6].id,
      store_id: stores[1].id,
      rating: 5,
      comment:
        'I dream about the aloo tikki here. Crispy outside, soft inside. Heaven.',
    },
    {
      user_id: users[7].id,
      store_id: stores[1].id,
      rating: 3,
      comment:
        'Good chaat but had to wait 20 minutes. Could be faster during rush hour.',
    },

    // Store 2: Sunil's Kacchi Ghor
    {
      user_id: users[8].id,
      store_id: stores[2].id,
      rating: 5,
      comment:
        'The kacchi biriyani is absolutely unreal. Tender mutton, fragrant rice. Best in Chittagong!',
    },
    {
      user_id: users[9].id,
      store_id: stores[2].id,
      rating: 5,
      comment:
        'Tehari here is the real deal. Rich beef flavor with perfect spice balance.',
    },
    {
      user_id: users[10].id,
      store_id: stores[2].id,
      rating: 4,
      comment:
        'Jali kabab was amazing. Kacchi could use a bit more saffron though.',
    },
    {
      user_id: users[11].id,
      store_id: stores[2].id,
      rating: 5,
      comment:
        'Chittagong kacchi at its finest. The borhani pairs perfectly with it.',
    },

    // Store 3: Anita's Shutki Corner
    {
      user_id: users[0].id,
      store_id: stores[3].id,
      rating: 4,
      comment:
        'Authentic shutki bhorta! Takes me back to my village. Perfectly pungent and spicy.',
    },
    {
      user_id: users[2].id,
      store_id: stores[3].id,
      rating: 5,
      comment:
        'Shutki platter is the best value. Every bhorta is different and delicious.',
    },
    {
      user_id: users[4].id,
      store_id: stores[3].id,
      rating: 4,
      comment:
        'Loitta shutki fry is crispy and flavorful. Real Chittagong taste.',
    },
    {
      user_id: users[12].id,
      store_id: stores[3].id,
      rating: 3,
      comment: 'Good food but the smell is strong. Sit outside if you can.',
    },

    // Store 4: Bikash's Jhalmuri Stall
    {
      user_id: users[1].id,
      store_id: stores[4].id,
      rating: 5,
      comment:
        'Best jhalmuri in CRB! The mustard oil makes all the difference. So fresh.',
    },
    {
      user_id: users[3].id,
      store_id: stores[4].id,
      rating: 4,
      comment:
        'Tok doi muri is unique and delicious. Sweet and sour combo works great.',
    },
    {
      user_id: users[5].id,
      store_id: stores[4].id,
      rating: 4,
      comment:
        'Roasted corn with lime is the perfect evening snack. Simple but amazing.',
    },
    {
      user_id: users[13].id,
      store_id: stores[4].id,
      rating: 5,
      comment:
        'My go-to spot for jhalmuri. Consistent quality every single time.',
    },

    // Store 5: Deepa's Chotpoti Corner
    {
      user_id: users[6].id,
      store_id: stores[5].id,
      rating: 5,
      comment: 'Cheapest and tastiest chotpoti in Nasirabad. Perfectly spicy!',
    },
    {
      user_id: users[7].id,
      store_id: stores[5].id,
      rating: 4,
      comment:
        'Fuchka is nice. Not as good as GEC stalls but solid for the price.',
    },
    {
      user_id: users[8].id,
      store_id: stores[5].id,
      rating: 4,
      comment: 'Aloo dum and chotpoti combo is my go-to evening snack here.',
    },
    {
      user_id: users[14].id,
      store_id: stores[5].id,
      rating: 5,
      comment: 'Halim here is rich and hearty. Perfect for winter evenings.',
    },

    // Store 6: Gopal's Singara & Samosa
    {
      user_id: users[9].id,
      store_id: stores[6].id,
      rating: 5,
      comment:
        'Crispiest singara in New Market! Hot from the oil, perfect with cha.',
    },
    {
      user_id: users[10].id,
      store_id: stores[6].id,
      rating: 4,
      comment:
        'Piaju and beguni combo is classic Bengali iftar food. Loved it.',
    },
    {
      user_id: users[11].id,
      store_id: stores[6].id,
      rating: 5,
      comment:
        'Aloo chop here is the best thing I have eaten this month. Incredible.',
    },
    {
      user_id: users[0].id,
      store_id: stores[6].id,
      rating: 4,
      comment:
        'Good singara, samosa was average. Stick to the singara and piaju.',
    },

    // Store 7: Maya's Cha & Nasta
    {
      user_id: users[12].id,
      store_id: stores[7].id,
      rating: 4,
      comment:
        'The 7-layer tea is a masterpiece. Beautiful to look at, delicious to drink.',
    },
    {
      user_id: users[13].id,
      store_id: stores[7].id,
      rating: 3,
      comment:
        'Tea is great but nasta options are limited. More variety would be nice.',
    },
    {
      user_id: users[14].id,
      store_id: stores[7].id,
      rating: 4,
      comment:
        'Bun-kabab with layered cha at sunset by Patenga. Perfect combo.',
    },

    // Store 8: Halishahar Doi Stall
    {
      user_id: users[1].id,
      store_id: stores[8].id,
      rating: 5,
      comment:
        'THE mishti doi of Chittagong. Creamy, sweet, served in a clay pot. A must-visit!',
    },
    {
      user_id: users[4].id,
      store_id: stores[8].id,
      rating: 5,
      comment:
        'Borhani here is out of this world. Spicy, tangy, and so refreshing.',
    },
    {
      user_id: users[6].id,
      store_id: stores[8].id,
      rating: 4,
      comment: 'Love the mishti doi. Great quality for the price.',
    },

    // Store 9: Khatunganj Lassi Stall
    {
      user_id: users[2].id,
      store_id: stores[9].id,
      rating: 4,
      comment: 'Thick mango lassi, very refreshing on a hot day. Good prices.',
    },
    {
      user_id: users[9].id,
      store_id: stores[9].id,
      rating: 5,
      comment:
        'Best lassi in Khatunganj! Thick, cold, and always fresh. My daily stop.',
    },
    {
      user_id: users[3].id,
      store_id: stores[9].id,
      rating: 4,
      comment:
        'Banana shake was excellent. Borhani special is the hidden gem here.',
    },

    // Store 10: Sitakunda Pitha House
    {
      user_id: users[5].id,
      store_id: stores[10].id,
      rating: 5,
      comment:
        'Fresh bhapa pitha in the morning is heaven. Sweet coconut filling, steaming hot.',
    },
    {
      user_id: users[8].id,
      store_id: stores[10].id,
      rating: 4,
      comment:
        'Chitoi pitha with khejur gur — classic winter breakfast. Loved it.',
    },
    {
      user_id: users[11].id,
      store_id: stores[10].id,
      rating: 4,
      comment: 'Patishapta was decent. Bhapa pitha is the star here.',
    },

    // Store 11: Mirsharai Fish BBQ
    {
      user_id: users[7].id,
      store_id: stores[11].id,
      rating: 5,
      comment:
        'Grilled rupchanda by the beach — does it get any better? Incredible flavor.',
    },
    {
      user_id: users[10].id,
      store_id: stores[11].id,
      rating: 5,
      comment:
        'Lobster BBQ is massive and delicious. Worth the drive to Mirsharai.',
    },
    {
      user_id: users[14].id,
      store_id: stores[11].id,
      rating: 4,
      comment: 'Grilled chingri is great value. Fish fry was perfectly crispy.',
    },
  ];

  const reviews: { id: string; store_id: string }[] = [];
  for (const r of reviewsData) {
    const review = await prisma.review.upsert({
      where: { user_id_store_id: { user_id: r.user_id, store_id: r.store_id } },
      update: {},
      create: r,
      select: { id: true, store_id: true },
    });
    reviews.push(review);
  }
  console.log(`  ✅ Added ${reviews.length} reviews`);

  // ═══════════════════════════════════════════════════════════════════════════
  // REVIEW REPLIES (store owners replying to reviews on their stores)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n💬 Adding review replies...');
  const repliesData = [
    {
      review_id: reviews[0].id,
      store_id: stores[0].id,
      reply_text:
        'Thank you Alice! So glad you love our fuchka. See you again at GEC!',
    },
    {
      review_id: reviews[1].id,
      store_id: stores[0].id,
      reply_text:
        'Thanks Bob! Doi fuchka is our specialty. Come try the new tamarind batch!',
    },
    {
      review_id: reviews[2].id,
      store_id: stores[0].id,
      reply_text: 'Chotpoti fans unite! Thanks for the kind words Carol.',
    },
    {
      review_id: reviews[5].id,
      store_id: stores[1].id,
      reply_text: 'Thank you so much! We put a lot of love into our pani puri.',
    },
    {
      review_id: reviews[7].id,
      store_id: stores[1].id,
      reply_text:
        'Glad you enjoyed the aloo tikki! It is our most popular item.',
    },
    {
      review_id: reviews[9].id,
      store_id: stores[2].id,
      reply_text:
        'Thank you! We cook our kacchi in traditional clay pots for the best flavor.',
    },
    {
      review_id: reviews[12].id,
      store_id: stores[2].id,
      reply_text: 'Borhani and kacchi is the perfect combo. Thank you Laxmi!',
    },
    {
      review_id: reviews[13].id,
      store_id: stores[3].id,
      reply_text:
        "Thanks for visiting! Our shutki is sourced fresh from Cox's Bazar.",
    },
    {
      review_id: reviews[14].id,
      store_id: stores[3].id,
      reply_text:
        'The platter is our pride! Real Chittagong shutki taste. Thanks Carol!',
    },
    {
      review_id: reviews[17].id,
      store_id: stores[4].id,
      reply_text:
        'Thank you! Our mustard oil jhalmuri is made fresh every batch!',
    },
    {
      review_id: reviews[20].id,
      store_id: stores[4].id,
      reply_text: 'We love our regulars! See you next evening Nisha.',
    },
    {
      review_id: reviews[21].id,
      store_id: stores[5].id,
      reply_text: 'Thanks! We keep it spicy and affordable. That is our motto.',
    },
    {
      review_id: reviews[24].id,
      store_id: stores[5].id,
      reply_text: 'Halim is our winter special! Glad you discovered it Om.',
    },
    {
      review_id: reviews[25].id,
      store_id: stores[6].id,
      reply_text: 'Thank you! Fresh singara every hour, that is our secret.',
    },
    {
      review_id: reviews[27].id,
      store_id: stores[6].id,
      reply_text: 'Aloo chop is our bestseller! Thanks Laxmi!',
    },
    {
      review_id: reviews[29].id,
      store_id: stores[7].id,
      reply_text:
        'Glad you enjoy the layered cha! We are working on adding more nasta items.',
    },
  ];

  await prisma.reviewReply.createMany({ data: repliesData });
  console.log(`  ✅ Added ${repliesData.length} review replies`);

  // ═══════════════════════════════════════════════════════════════════════════
  // STORE SUGGESTIONS (users suggesting new stores to add)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n📝 Adding store suggestions...');
  const suggestionsData = [
    {
      suggested_by: users[0].id,
      name: 'Bahaddarhat Fuchka Stall',
      description:
        'Small stall near Bahaddarhat bus stand. Amazing fuchka for 20 taka.',
      address: 'Bahaddarhat, Chittagong',
      latitude: 22.3445,
      longitude: 91.814,
      status: 'pending',
    },
    {
      suggested_by: users[1].id,
      name: 'Dampara Juice Center',
      description:
        'Fresh juice and sugarcane bar near Dampara. Runs since 2010.',
      address: 'Dampara, Chittagong',
      latitude: 22.3505,
      longitude: 91.831,
      status: 'pending',
    },
    {
      suggested_by: users[2].id,
      name: 'Firingi Bazaar Haleem House',
      description: 'Best haleem in Chittagong. Family run for 20 years.',
      address: 'Firingi Bazaar, Chittagong',
      latitude: 22.343,
      longitude: 91.838,
      status: 'approved',
      admin_note: 'Verified — store will be added soon.',
    },
    {
      suggested_by: users[3].id,
      name: 'Lalkhan Bazaar Shingara Stall',
      description: 'Iconic shingara stall near Lalkhan Bazaar. Hot and crispy.',
      address: 'Lalkhan Bazaar, Chittagong',
      latitude: 22.355,
      longitude: 91.826,
      status: 'approved',
      admin_note: 'Classic spot. Will add to database.',
    },
    {
      suggested_by: users[4].id,
      name: 'Pahartali Biryani House',
      description:
        'Best kacchi biryani near Pahartali. Very popular with locals.',
      address: 'Pahartali, Chittagong',
      latitude: 22.381,
      longitude: 91.796,
      status: 'rejected',
      admin_note: 'This is a restaurant, not street food.',
    },
    {
      suggested_by: users[5].id,
      name: 'Oxygen Mora Piaju Corner',
      description:
        'Evening piaju and beguni stall. Onion and brinjal fritters.',
      address: 'Oxygen, Chittagong',
      latitude: 22.362,
      longitude: 91.805,
      status: 'pending',
    },
    {
      suggested_by: users[6].id,
      name: 'Patenga Beach Jhalmuri',
      description: 'Spicy jhalmuri at Patenga beach. Perfect sunset snack.',
      address: 'Patenga Beach, Chittagong',
      latitude: 22.236,
      longitude: 91.7915,
      status: 'pending',
    },
    {
      suggested_by: users[7].id,
      name: 'Sadarghat Kabab Point',
      description:
        'Seekh kabab and boti kabab near Sadarghat. Smoky and tender.',
      address: 'Sadarghat, Chittagong',
      latitude: 22.338,
      longitude: 91.841,
      status: 'approved',
      admin_note: 'Great kabab spot. Adding soon.',
    },
    {
      suggested_by: users[8].id,
      name: 'Chawkbazar Corn Cart',
      description:
        'Roasted corn cart near Chawkbazar. Seasonal but very popular.',
      address: 'Chawkbazar, Chittagong',
      latitude: 22.3475,
      longitude: 91.833,
      status: 'pending',
    },
    {
      suggested_by: users[9].id,
      name: 'Reazuddin Bazaar Fruit Chaat',
      description: 'Fresh fruit chaat stall near Reazuddin Bazaar.',
      address: 'Reazuddin Bazaar, Chittagong',
      latitude: 22.339,
      longitude: 91.835,
      status: 'pending',
    },
  ];

  await prisma.storeSuggestion.createMany({ data: suggestionsData });
  console.log(`  ✅ Added ${suggestionsData.length} store suggestions`);

  // ═══════════════════════════════════════════════════════════════════════════
  // STORE CLAIMS (users claiming unclaimed stores)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n🏷️  Adding store claims...');
  const claimsData = [
    {
      store_id: stores[8].id,
      claimed_by: users[3].id,
      message:
        'I am the son of the original owner. We have been selling mishti doi in Halishahar for 25 years. I can provide documentation.',
      status: 'pending',
    },
    {
      store_id: stores[9].id,
      claimed_by: users[5].id,
      message:
        'This is my lassi stall in Khatunganj. I have been running it since 2015. Happy to verify in person.',
      status: 'pending',
    },
    {
      store_id: stores[10].id,
      claimed_by: users[8].id,
      message:
        'My family owns this pitha house in Sitakunda. We sell every morning from 6 AM.',
      status: 'approved',
      admin_note: 'Verified via phone call. Ownership confirmed.',
    },
    {
      store_id: stores[11].id,
      claimed_by: users[11].id,
      message:
        'I am the owner of this fish BBQ stall at Mirsharai beach. Running it for 8 years now.',
      status: 'rejected',
      admin_note:
        'Could not verify ownership. Please provide business registration.',
    },
    {
      store_id: stores[8].id,
      claimed_by: users[7].id,
      message:
        'I work here and manage the doi stall. The owner asked me to register it.',
      status: 'rejected',
      admin_note: 'Only the owner can claim the store, not employees.',
    },
  ];

  await prisma.storeClaim.createMany({ data: claimsData });
  console.log(`  ✅ Added ${claimsData.length} store claims`);

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════════════════════');
  console.log('✅ SEED COMPLETE!');
  console.log('══════════════════════════════════════════════════════');
  console.log(`  👑 Admins:           2`);
  console.log(`  👤 Regular Users:    ${users.length}`);
  console.log(`  🏪 Store Owners:     ${owners.length}`);
  console.log(
    `  🏬 Stores:           ${stores.length} (${stores.length - 4} claimed, 4 unclaimed)`,
  );
  console.log(`  🍜 Food Items:       ${foodsData.length}`);
  console.log(`  ⭐ Reviews:          ${reviews.length}`);
  console.log(`  💬 Review Replies:   ${repliesData.length}`);
  console.log(`  📝 Suggestions:      ${suggestionsData.length}`);
  console.log(`  🏷️  Claims:           ${claimsData.length}`);
  console.log('══════════════════════════════════════════════════════');
  console.log('\n📋 Test Accounts:');
  console.log('─────────────────────────────────────────────────────');
  console.log('  ADMIN');
  console.log('    admin@streetfood.com          / Admin@123456');
  console.log('    sita.mod@streetfood.com       / Admin@123456');
  console.log('  USERS (password: User@1234)');
  for (const u of users) {
    console.log(`    ${u.email.padEnd(33)} / User@1234`);
  }
  console.log('  STORE OWNERS (password: Store@1234)');
  for (const o of owners) {
    console.log(`    ${o.email.padEnd(33)} / Store@1234`);
  }
  console.log('─────────────────────────────────────────────────────\n');
}

seed()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
