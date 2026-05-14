import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SALT_ROUNDS = 10;
async function hash(p: string) {
  return bcrypt.hash(p, SALT_ROUNDS);
}

// ── Food image URLs (Unsplash) ───────────────────────────────────────────────
const IMG = {
  fuchka:
    'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&q=80',
  biryani:
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80',
  samosa:
    'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80',
  tea: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80',
  fish: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80',
  lassi: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&q=80',
  grilled:
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80',
  sweet: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&q=80',
  rice: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400&q=80',
  corn: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&q=80',
  bread:
    'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80',
  kabab: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80',
  juice:
    'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&q=80',
  pitha:
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80',
  chaat:
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80',
  snack:
    'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&q=80',
  yogurt:
    'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80',
  prawn:
    'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400&q=80',
  halim:
    'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&q=80',
  paratha:
    'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80',
};

// ── Helpers ──────────────────────────────────────────────────────────────────
async function upsertStore(data: any): Promise<{ id: string; name: string }> {
  const ex = await prisma.store.findFirst({
    where: { name: data.name },
    select: { id: true, name: true },
  });
  if (ex) {
    await prisma.store.update({ where: { id: ex.id }, data });
    return ex;
  }
  return prisma.store.create({ data, select: { id: true, name: true } });
}

async function upsertFood(data: {
  store_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available?: boolean;
}) {
  const ex = await prisma.food.findFirst({
    where: { store_id: data.store_id, name: data.name },
  });
  if (ex) {
    await prisma.food.update({ where: { id: ex.id }, data });
  } else {
    await prisma.food.create({ data });
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('🌱 Seeding database (upsert mode — no data deleted)…\n');

  // ── Admins ──
  console.log('👑 Admins…');
  const adminPw = await hash('Admin@123456');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@streetfood.com' },
    update: { name: 'Platform Admin', role: 'admin' },
    create: {
      name: 'Platform Admin',
      email: 'admin@streetfood.com',
      password: adminPw,
      role: 'admin',
      bio: 'Platform administrator.',
    },
  });
  await prisma.user.upsert({
    where: { email: 'sita.mod@streetfood.com' },
    update: { name: 'Sita Moderator', role: 'admin' },
    create: {
      name: 'Sita Moderator',
      email: 'sita.mod@streetfood.com',
      password: adminPw,
      role: 'admin',
      bio: 'Content moderator.',
    },
  });
  console.log(`  ✅ ${admin.name} (admin@streetfood.com)`);

  // ── Regular users ──
  console.log('\n👤 Regular users…');
  const userPw = await hash('User@1234');
  const usersData = [
    { name: 'Alice Johnson', email: 'alice@example.com' },
    { name: 'Bob Smith', email: 'bob@example.com' },
    { name: 'Carol White', email: 'carol@example.com' },
    { name: 'David Tamang', email: 'david.tamang@example.com' },
    { name: 'Eva Shrestha', email: 'eva.shrestha@example.com' },
    { name: 'Farhan Ali', email: 'farhan.ali@example.com' },
    { name: 'Grace Gurung', email: 'grace.gurung@example.com' },
    { name: 'Hari Bahadur', email: 'hari.bahadur@example.com' },
    { name: 'Isha Rai', email: 'isha.rai@example.com' },
    { name: 'Jay Adhikari', email: 'jay.adhikari@example.com' },
    { name: 'Kabita Thapa', email: 'kabita.thapa@example.com' },
    { name: 'Laxmi Maharjan', email: 'laxmi.maharjan@example.com' },
    { name: 'Milan Karki', email: 'milan.karki@example.com' },
    { name: 'Nisha Pandey', email: 'nisha.pandey@example.com' },
    { name: 'Om Basnet', email: 'om.basnet@example.com' },
  ];
  const users: { id: string; name: string; email: string }[] = [];
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name },
      create: { ...u, password: userPw, role: 'user' },
      select: { id: true, name: true, email: true },
    });
    users.push(user);
    console.log(`  ✅ ${user.name}`);
  }

  // ── Store owners ──
  console.log('\n🏪 Store owners…');
  const storePw = await hash('Store@1234');
  const ownersData = [
    { name: 'Ravi Kumar', email: 'ravi@momos.com' },
    { name: 'Priya Sharma', email: 'priya@chaats.com' },
    { name: 'Sunil Maharjan', email: 'sunil@newari.com' },
    { name: 'Anita Rai', email: 'anita@sekuwa.com' },
    { name: 'Bikash Lama', email: 'bikash@thukpa.com' },
    { name: 'Deepa KC', email: 'deepa@chatpate.com' },
    { name: 'Gopal Shrestha', email: 'gopal@samosa.com' },
    { name: 'Maya Tamang', email: 'maya@tea.com' },
  ];
  const owners: { id: string; name: string; email: string }[] = [];
  for (const o of ownersData) {
    const owner = await prisma.user.upsert({
      where: { email: o.email },
      update: { name: o.name },
      create: { ...o, password: storePw, role: 'store' },
      select: { id: true, name: true, email: true },
    });
    owners.push(owner);
    console.log(`  ✅ ${owner.name}`);
  }

  // ── Stores ──
  console.log('\n🏬 Stores…');
  const storesData = [
    {
      owner_id: owners[0].id,
      name: "Ravi's Fuchka House",
      description:
        'Crispy fuchka with tangy tamarind water. Best in Chittagong!',
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
      description: 'Famous Chittagong kacchi biriyani. Cooked in clay pots.',
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
      description: 'Dried fish delicacies — shutki bhorta, shutki curry.',
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
      description: 'Spicy jhalmuri, chanachur, and masala peanuts.',
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
      description: 'Chotpoti, dahi puri, and aloo dum — always fresh.',
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
      description: 'Crispy singara and samosa with neem pata chutney.',
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
      description: 'Layered tea, biscuit, and evening nasta.',
      category: 'Tea & Beverages',
      address: 'Patenga Road, Chittagong',
      latitude: 22.251,
      longitude: 91.792,
      status: 'active',
      is_claimed: true,
    },
    {
      owner_id: null,
      name: 'Halishahar Doi Stall',
      description: 'Famous Chittagong mishti doi and borhani.',
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
      description: 'Traditional pitha — bhapa, chitoi, patishapta.',
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
      description: 'Grilled sea fish and lobster on the beach.',
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
    const store = await upsertStore(s);
    stores.push(store);
    console.log(`  ✅ ${store.name}`);
  }

  // ── Foods (with images) ──
  console.log('\n🍜 Foods (with images)…');
  const foodsData = [
    // Store 0 — Ravi's Fuchka House
    {
      store_id: stores[0].id,
      name: 'Fuchka (8 pcs)',
      description: 'Crispy hollow puris with tangy tamarind water',
      price: 30,
      image_url: IMG.fuchka,
      is_available: true,
    },
    {
      store_id: stores[0].id,
      name: 'Doi Fuchka (8 pcs)',
      description: 'Fuchka topped with sweet yogurt and tamarind',
      price: 40,
      image_url: IMG.fuchka,
      is_available: true,
    },
    {
      store_id: stores[0].id,
      name: 'Aloor Dum',
      description: 'Spiced potato curry served with puri',
      price: 25,
      image_url: IMG.chaat,
      is_available: true,
    },
    {
      store_id: stores[0].id,
      name: 'Chotpoti',
      description: 'Spiced chickpea mix with tamarind and chili',
      price: 30,
      image_url: IMG.chaat,
      is_available: true,
    },
    {
      store_id: stores[0].id,
      name: 'Papri Chaat',
      description: 'Crispy papri with yogurt, chutney, and sev',
      price: 35,
      image_url: IMG.chaat,
      is_available: true,
    },
    {
      store_id: stores[0].id,
      name: 'Dahi Bora',
      description: 'Fried lentil balls soaked in spiced yogurt',
      price: 30,
      image_url: IMG.yogurt,
      is_available: true,
    },
    {
      store_id: stores[0].id,
      name: 'Chanachur Mix',
      description: 'Spicy puffed rice mix with onion, chili, and lemon',
      price: 15,
      image_url: IMG.snack,
      is_available: true,
    },
    // Store 1 — Priya's Chaat Palace
    {
      store_id: stores[1].id,
      name: 'Pani Puri (6 pcs)',
      description: 'Crispy hollow puris with tangy mint water',
      price: 25,
      image_url: IMG.fuchka,
      is_available: true,
    },
    {
      store_id: stores[1].id,
      name: 'Bhel Puri',
      description: 'Puffed rice with tangy chutneys and sev',
      price: 30,
      image_url: IMG.snack,
      is_available: true,
    },
    {
      store_id: stores[1].id,
      name: 'Aloo Tikki',
      description: 'Crispy potato patties with chole and chutney',
      price: 40,
      image_url: IMG.chaat,
      is_available: true,
    },
    {
      store_id: stores[1].id,
      name: 'Dahi Puri',
      description: 'Puri topped with sweet yogurt and tamarind',
      price: 35,
      image_url: IMG.yogurt,
      is_available: true,
    },
    {
      store_id: stores[1].id,
      name: 'Sev Puri',
      description: 'Flat puris with sev, onion, and green chutney',
      price: 30,
      image_url: IMG.snack,
      is_available: true,
    },
    {
      store_id: stores[1].id,
      name: 'Papdi Chaat',
      description: 'Crispy papdi with chana, curd, and chutneys',
      price: 45,
      image_url: IMG.chaat,
      is_available: true,
    },
    {
      store_id: stores[1].id,
      name: 'Samosa Chaat',
      description: 'Crushed samosa with chole and tangy chutneys',
      price: 50,
      image_url: IMG.samosa,
      is_available: true,
    },
    // Store 2 — Sunil's Kacchi Ghor
    {
      store_id: stores[2].id,
      name: 'Kacchi Biriyani',
      description: 'Aromatic rice with tender mutton, Chittagong style',
      price: 200,
      image_url: IMG.biryani,
      is_available: true,
    },
    {
      store_id: stores[2].id,
      name: 'Tehari',
      description: 'Spiced beef tehari cooked in mustard oil',
      price: 120,
      image_url: IMG.biryani,
      is_available: true,
    },
    {
      store_id: stores[2].id,
      name: 'Chicken Biriyani',
      description: 'Fragrant chicken biriyani with raita',
      price: 150,
      image_url: IMG.biryani,
      is_available: true,
    },
    {
      store_id: stores[2].id,
      name: 'Borhani',
      description: 'Spiced yogurt drink, perfect with biriyani',
      price: 30,
      image_url: IMG.lassi,
      is_available: true,
    },
    {
      store_id: stores[2].id,
      name: 'Mutton Rezala',
      description: 'Creamy spiced mutton curry',
      price: 180,
      image_url: IMG.rice,
      is_available: true,
    },
    {
      store_id: stores[2].id,
      name: 'Jali Kabab',
      description: 'Minced meat patty, crispy outside, juicy inside',
      price: 40,
      image_url: IMG.kabab,
      is_available: true,
    },
    // Store 3 — Anita's Shutki Corner
    {
      store_id: stores[3].id,
      name: 'Shutki Bhorta',
      description: 'Mashed dried fish with chili, onion, mustard oil',
      price: 60,
      image_url: IMG.fish,
      is_available: true,
    },
    {
      store_id: stores[3].id,
      name: 'Shutki Shira',
      description: 'Dried fish cooked in spicy gravy',
      price: 80,
      image_url: IMG.fish,
      is_available: true,
    },
    {
      store_id: stores[3].id,
      name: 'Loitta Shutki Fry',
      description: 'Crispy fried Bombay duck dried fish',
      price: 70,
      image_url: IMG.fish,
      is_available: true,
    },
    {
      store_id: stores[3].id,
      name: 'Chingri Bhorta',
      description: 'Mashed dried shrimp with green chili',
      price: 90,
      image_url: IMG.prawn,
      is_available: true,
    },
    {
      store_id: stores[3].id,
      name: 'Shutki Vorta Platter',
      description: 'Assorted bhorta platter with rice',
      price: 150,
      image_url: IMG.fish,
      is_available: true,
    },
    {
      store_id: stores[3].id,
      name: 'Hilsha Fish Fry',
      description: 'Fried hilsha marinated in turmeric and salt',
      price: 200,
      image_url: IMG.fish,
      is_available: true,
    },
    // Store 4 — Bikash's Jhalmuri Stall
    {
      store_id: stores[4].id,
      name: 'Jhalmuri',
      description: 'Spicy puffed rice with mustard oil and lemon',
      price: 15,
      image_url: IMG.snack,
      is_available: true,
    },
    {
      store_id: stores[4].id,
      name: 'Masala Muri',
      description: 'Puffed rice tossed with spices and peanuts',
      price: 10,
      image_url: IMG.snack,
      is_available: true,
    },
    {
      store_id: stores[4].id,
      name: 'Chanachur',
      description: 'Crunchy spiced mixture with chickpeas',
      price: 20,
      image_url: IMG.snack,
      is_available: true,
    },
    {
      store_id: stores[4].id,
      name: 'Masala Badam',
      description: 'Roasted peanuts with chili and salt',
      price: 15,
      image_url: IMG.snack,
      is_available: true,
    },
    {
      store_id: stores[4].id,
      name: 'Makka Bhutta',
      description: 'Roasted corn on the cob with lime and chili',
      price: 20,
      image_url: IMG.corn,
      is_available: true,
    },
    {
      store_id: stores[4].id,
      name: 'Tok Doi Muri',
      description: 'Puffed rice with sour yogurt and jaggery',
      price: 25,
      image_url: IMG.yogurt,
      is_available: true,
    },
    // Store 5 — Deepa's Chotpoti Corner
    {
      store_id: stores[5].id,
      name: 'Chotpoti',
      description: 'Spiced chickpea mix with tamarind and chili',
      price: 25,
      image_url: IMG.chaat,
      is_available: true,
    },
    {
      store_id: stores[5].id,
      name: 'Fuchka (8 pcs)',
      description: 'Crunchy puris with spiced water filling',
      price: 30,
      image_url: IMG.fuchka,
      is_available: true,
    },
    {
      store_id: stores[5].id,
      name: 'Aloo Dum',
      description: 'Spiced potato curry served with puri',
      price: 30,
      image_url: IMG.chaat,
      is_available: true,
    },
    {
      store_id: stores[5].id,
      name: 'Dahi Puri',
      description: 'Crispy puri with yogurt toppings',
      price: 35,
      image_url: IMG.yogurt,
      is_available: true,
    },
    {
      store_id: stores[5].id,
      name: 'Fruit Chaat',
      description: 'Seasonal fruits with chaat masala and lime',
      price: 40,
      image_url: IMG.chaat,
      is_available: true,
    },
    {
      store_id: stores[5].id,
      name: 'Halim',
      description: 'Slow-cooked wheat and meat porridge',
      price: 50,
      image_url: IMG.halim,
      is_available: true,
    },
    // Store 6 — Gopal's Singara & Samosa
    {
      store_id: stores[6].id,
      name: 'Singara (2 pcs)',
      description: 'Classic Bengali potato singara, crispy shell',
      price: 15,
      image_url: IMG.samosa,
      is_available: true,
    },
    {
      store_id: stores[6].id,
      name: 'Samosa (2 pcs)',
      description: 'Minced meat filled samosa, spiced and fried',
      price: 20,
      image_url: IMG.samosa,
      is_available: true,
    },
    {
      store_id: stores[6].id,
      name: 'Piaju (4 pcs)',
      description: 'Onion fritters, crispy and golden',
      price: 15,
      image_url: IMG.snack,
      is_available: true,
    },
    {
      store_id: stores[6].id,
      name: 'Beguni (4 pcs)',
      description: 'Brinjal fritters in gram flour batter',
      price: 15,
      image_url: IMG.snack,
      is_available: true,
    },
    {
      store_id: stores[6].id,
      name: 'Puri (4 pcs)',
      description: 'Deep fried puffed bread',
      price: 20,
      image_url: IMG.bread,
      is_available: true,
    },
    {
      store_id: stores[6].id,
      name: 'Aloo Chop (2 pcs)',
      description: 'Potato croquettes coated in egg and crumbs',
      price: 20,
      image_url: IMG.snack,
      is_available: true,
    },
    // Store 7 — Maya's Cha & Nasta
    {
      store_id: stores[7].id,
      name: 'Layered Cha',
      description: 'Chittagong famous 7-layer tea',
      price: 30,
      image_url: IMG.tea,
      is_available: true,
    },
    {
      store_id: stores[7].id,
      name: 'Doodh Cha',
      description: 'Sweet milk tea, strong and creamy',
      price: 15,
      image_url: IMG.tea,
      is_available: true,
    },
    {
      store_id: stores[7].id,
      name: 'Lal Cha',
      description: 'Red tea with lime, no milk',
      price: 10,
      image_url: IMG.tea,
      is_available: true,
    },
    {
      store_id: stores[7].id,
      name: 'Toast & Butter',
      description: 'Toasted bread with butter',
      price: 20,
      image_url: IMG.bread,
      is_available: true,
    },
    {
      store_id: stores[7].id,
      name: 'Bun-Kabab',
      description: 'Soft bun with spiced kabab patty',
      price: 30,
      image_url: IMG.kabab,
      is_available: true,
    },
    {
      store_id: stores[7].id,
      name: 'Paratha with Egg',
      description: 'Flaky paratha with fried egg and dal',
      price: 40,
      image_url: IMG.paratha,
      is_available: true,
    },
    // Store 8 — Halishahar Doi Stall
    {
      store_id: stores[8].id,
      name: 'Mishti Doi (Small)',
      description: 'Sweet set yogurt in clay pot',
      price: 30,
      image_url: IMG.yogurt,
      is_available: true,
    },
    {
      store_id: stores[8].id,
      name: 'Mishti Doi (Large)',
      description: 'Sweet set yogurt in large clay pot',
      price: 60,
      image_url: IMG.yogurt,
      is_available: true,
    },
    {
      store_id: stores[8].id,
      name: 'Borhani',
      description: 'Spiced yogurt drink with mint',
      price: 25,
      image_url: IMG.lassi,
      is_available: true,
    },
    {
      store_id: stores[8].id,
      name: 'Lassi',
      description: 'Thick sweet yogurt drink',
      price: 30,
      image_url: IMG.lassi,
      is_available: true,
    },
    // Store 9 — Khatunganj Lassi Stall
    {
      store_id: stores[9].id,
      name: 'Plain Lassi',
      description: 'Traditional thick yogurt drink',
      price: 25,
      image_url: IMG.lassi,
      is_available: true,
    },
    {
      store_id: stores[9].id,
      name: 'Mango Lassi',
      description: 'Lassi blended with fresh mango pulp',
      price: 40,
      image_url: IMG.juice,
      is_available: true,
    },
    {
      store_id: stores[9].id,
      name: 'Banana Shake',
      description: 'Thick banana milkshake',
      price: 35,
      image_url: IMG.juice,
      is_available: true,
    },
    {
      store_id: stores[9].id,
      name: 'Borhani Special',
      description: 'Extra spiced yogurt drink with black pepper',
      price: 30,
      image_url: IMG.lassi,
      is_available: true,
    },
    // Store 10 — Sitakunda Pitha House
    {
      store_id: stores[10].id,
      name: 'Bhapa Pitha',
      description: 'Steamed rice cake with coconut and jaggery filling',
      price: 20,
      image_url: IMG.pitha,
      is_available: true,
    },
    {
      store_id: stores[10].id,
      name: 'Chitoi Pitha',
      description: 'Thin rice pancake, soft and steamy',
      price: 15,
      image_url: IMG.pitha,
      is_available: true,
    },
    {
      store_id: stores[10].id,
      name: 'Patishapta',
      description: 'Rice crepe rolled with kheer filling',
      price: 25,
      image_url: IMG.sweet,
      is_available: true,
    },
    {
      store_id: stores[10].id,
      name: 'Puli Pitha',
      description: 'Crescent shaped dumpling with coconut filling',
      price: 20,
      image_url: IMG.pitha,
      is_available: true,
    },
    // Store 11 — Mirsharai Fish BBQ
    {
      store_id: stores[11].id,
      name: 'Grilled Rupchanda',
      description: 'Whole pomfret grilled with salt and chili',
      price: 200,
      image_url: IMG.grilled,
      is_available: true,
    },
    {
      store_id: stores[11].id,
      name: 'Grilled Chingri',
      description: 'Large prawns grilled on charcoal',
      price: 300,
      image_url: IMG.prawn,
      is_available: true,
    },
    {
      store_id: stores[11].id,
      name: 'Fish Fry (Vetki)',
      description: 'Crispy fried barramundi',
      price: 250,
      image_url: IMG.fish,
      is_available: true,
    },
    {
      store_id: stores[11].id,
      name: 'Lobster BBQ',
      description: 'Fresh lobster grilled with garlic butter',
      price: 500,
      image_url: IMG.grilled,
      is_available: true,
    },
    {
      store_id: stores[11].id,
      name: 'Shutki Bhorta Plate',
      description: 'Dried fish mash with rice and dal',
      price: 120,
      image_url: IMG.fish,
      is_available: true,
    },
  ];
  for (const f of foodsData) await upsertFood(f);
  console.log(
    `  ✅ Upserted ${foodsData.length} food items across ${stores.length} stores`,
  );

  // ── Reviews ──
  console.log('\n⭐ Reviews…');
  const reviewsData = [
    {
      user_id: users[0].id,
      store_id: stores[0].id,
      rating: 5,
      comment:
        'Best fuchka in GEC area! Perfectly crispy and the tamarind water is spot on.',
    },
    {
      user_id: users[1].id,
      store_id: stores[0].id,
      rating: 4,
      comment: 'Great fuchka, quick service. Doi fuchka is a must-try.',
    },
    {
      user_id: users[2].id,
      store_id: stores[0].id,
      rating: 5,
      comment:
        'Chotpoti here is incredible. Perfect balance of spice and tang.',
    },
    {
      user_id: users[3].id,
      store_id: stores[0].id,
      rating: 4,
      comment: 'Solid fuchka, slightly crowded in the evening.',
    },
    {
      user_id: users[4].id,
      store_id: stores[0].id,
      rating: 5,
      comment: 'Been coming here for years. Best street food at GEC Circle.',
    },
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
      comment: 'Papdi chaat was fresh and flavorful.',
    },
    {
      user_id: users[6].id,
      store_id: stores[1].id,
      rating: 5,
      comment:
        'I dream about the aloo tikki here. Crispy outside, soft inside.',
    },
    {
      user_id: users[7].id,
      store_id: stores[1].id,
      rating: 3,
      comment: 'Good chaat but had to wait 20 minutes.',
    },
    {
      user_id: users[8].id,
      store_id: stores[2].id,
      rating: 5,
      comment: 'The kacchi biriyani is absolutely unreal. Best in Chittagong!',
    },
    {
      user_id: users[9].id,
      store_id: stores[2].id,
      rating: 5,
      comment: 'Tehari here is the real deal. Rich beef flavor.',
    },
    {
      user_id: users[10].id,
      store_id: stores[2].id,
      rating: 4,
      comment: 'Jali kabab was amazing. Kacchi could use more saffron.',
    },
    {
      user_id: users[11].id,
      store_id: stores[2].id,
      rating: 5,
      comment: 'Chittagong kacchi at its finest. Borhani pairs perfectly.',
    },
    {
      user_id: users[0].id,
      store_id: stores[3].id,
      rating: 4,
      comment: 'Authentic shutki bhorta! Takes me back to my village.',
    },
    {
      user_id: users[2].id,
      store_id: stores[3].id,
      rating: 5,
      comment: 'Shutki platter is the best value.',
    },
    {
      user_id: users[4].id,
      store_id: stores[3].id,
      rating: 4,
      comment: 'Loitta shutki fry is crispy and flavorful.',
    },
    {
      user_id: users[12].id,
      store_id: stores[3].id,
      rating: 3,
      comment: 'Good food but the smell is strong.',
    },
    {
      user_id: users[1].id,
      store_id: stores[4].id,
      rating: 5,
      comment: 'Best jhalmuri in CRB! The mustard oil makes the difference.',
    },
    {
      user_id: users[3].id,
      store_id: stores[4].id,
      rating: 4,
      comment: 'Tok doi muri is unique. Sweet and sour combo works great.',
    },
    {
      user_id: users[5].id,
      store_id: stores[4].id,
      rating: 4,
      comment: 'Roasted corn with lime is the perfect evening snack.',
    },
    {
      user_id: users[13].id,
      store_id: stores[4].id,
      rating: 5,
      comment: 'My go-to spot for jhalmuri. Consistent quality.',
    },
    {
      user_id: users[6].id,
      store_id: stores[5].id,
      rating: 5,
      comment: 'Cheapest and tastiest chotpoti in Nasirabad!',
    },
    {
      user_id: users[7].id,
      store_id: stores[5].id,
      rating: 4,
      comment: 'Fuchka is nice. Solid for the price.',
    },
    {
      user_id: users[8].id,
      store_id: stores[5].id,
      rating: 4,
      comment: 'Aloo dum and chotpoti combo is my go-to snack.',
    },
    {
      user_id: users[14].id,
      store_id: stores[5].id,
      rating: 5,
      comment: 'Halim here is rich and hearty. Perfect for winter.',
    },
    {
      user_id: users[9].id,
      store_id: stores[6].id,
      rating: 5,
      comment: 'Crispiest singara in New Market! Hot from the oil.',
    },
    {
      user_id: users[10].id,
      store_id: stores[6].id,
      rating: 4,
      comment: 'Piaju and beguni — classic Bengali iftar food.',
    },
    {
      user_id: users[11].id,
      store_id: stores[6].id,
      rating: 5,
      comment: 'Aloo chop here is the best thing I have eaten this month.',
    },
    {
      user_id: users[0].id,
      store_id: stores[6].id,
      rating: 4,
      comment: 'Good singara. Stick to singara and piaju.',
    },
    {
      user_id: users[12].id,
      store_id: stores[7].id,
      rating: 4,
      comment: 'The 7-layer tea is a masterpiece.',
    },
    {
      user_id: users[13].id,
      store_id: stores[7].id,
      rating: 3,
      comment: 'Tea is great but nasta options are limited.',
    },
    {
      user_id: users[14].id,
      store_id: stores[7].id,
      rating: 4,
      comment: 'Bun-kabab with layered cha at sunset. Perfect.',
    },
    {
      user_id: users[1].id,
      store_id: stores[8].id,
      rating: 5,
      comment: 'THE mishti doi of Chittagong. Creamy, sweet, in a clay pot.',
    },
    {
      user_id: users[4].id,
      store_id: stores[8].id,
      rating: 5,
      comment: 'Borhani here is out of this world.',
    },
    {
      user_id: users[6].id,
      store_id: stores[8].id,
      rating: 4,
      comment: 'Love the mishti doi. Great quality.',
    },
    {
      user_id: users[2].id,
      store_id: stores[9].id,
      rating: 4,
      comment: 'Thick mango lassi, very refreshing.',
    },
    {
      user_id: users[9].id,
      store_id: stores[9].id,
      rating: 5,
      comment: 'Best lassi in Khatunganj! Thick, cold, always fresh.',
    },
    {
      user_id: users[3].id,
      store_id: stores[9].id,
      rating: 4,
      comment: 'Banana shake was excellent.',
    },
    {
      user_id: users[5].id,
      store_id: stores[10].id,
      rating: 5,
      comment: 'Fresh bhapa pitha in the morning is heaven.',
    },
    {
      user_id: users[8].id,
      store_id: stores[10].id,
      rating: 4,
      comment: 'Chitoi pitha with khejur gur — classic winter breakfast.',
    },
    {
      user_id: users[11].id,
      store_id: stores[10].id,
      rating: 4,
      comment: 'Patishapta was decent. Bhapa pitha is the star.',
    },
    {
      user_id: users[7].id,
      store_id: stores[11].id,
      rating: 5,
      comment: 'Grilled rupchanda by the beach — incredible flavor.',
    },
    {
      user_id: users[10].id,
      store_id: stores[11].id,
      rating: 5,
      comment: 'Lobster BBQ is massive and delicious.',
    },
    {
      user_id: users[14].id,
      store_id: stores[11].id,
      rating: 4,
      comment: 'Grilled chingri is great value. Fish fry perfectly crispy.',
    },
  ];
  const reviews: { id: string; store_id: string }[] = [];
  for (const r of reviewsData) {
    const rev = await prisma.review.upsert({
      where: { user_id_store_id: { user_id: r.user_id, store_id: r.store_id } },
      update: { rating: r.rating, comment: r.comment },
      create: r,
      select: { id: true, store_id: true },
    });
    reviews.push(rev);
  }
  console.log(`  ✅ ${reviews.length} reviews`);

  // ── Review replies ──
  console.log('\n💬 Review replies…');
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
      reply_text: 'Thank you! We put a lot of love into our pani puri.',
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
      reply_text: 'Thank you! We cook kacchi in traditional clay pots.',
    },
    {
      review_id: reviews[12].id,
      store_id: stores[2].id,
      reply_text: 'Borhani and kacchi is the perfect combo. Thank you Laxmi!',
    },
    {
      review_id: reviews[13].id,
      store_id: stores[3].id,
      reply_text: "Thanks! Our shutki is sourced fresh from Cox's Bazar.",
    },
    {
      review_id: reviews[14].id,
      store_id: stores[3].id,
      reply_text: 'The platter is our pride! Real Chittagong shutki taste.',
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
      reply_text: 'Thanks! We keep it spicy and affordable.',
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
      reply_text: 'Glad you enjoy the layered cha!',
    },
  ];
  for (const r of repliesData) {
    const ex = await prisma.reviewReply.findFirst({
      where: { review_id: r.review_id, store_id: r.store_id },
    });
    if (!ex) await prisma.reviewReply.create({ data: r });
    else
      await prisma.reviewReply.update({
        where: { id: ex.id },
        data: { reply_text: r.reply_text },
      });
  }
  console.log(`  ✅ ${repliesData.length} review replies`);

  // ── Store suggestions ──
  console.log('\n📝 Suggestions…');
  const suggestionsData = [
    {
      suggested_by: users[0].id,
      name: 'Bahaddarhat Fuchka Stall',
      description: 'Small stall near Bahaddarhat bus stand.',
      address: 'Bahaddarhat, Chittagong',
      latitude: 22.3445,
      longitude: 91.814,
      status: 'pending',
    },
    {
      suggested_by: users[1].id,
      name: 'Dampara Juice Center',
      description: 'Fresh juice and sugarcane bar.',
      address: 'Dampara, Chittagong',
      latitude: 22.3505,
      longitude: 91.831,
      status: 'pending',
    },
    {
      suggested_by: users[2].id,
      name: 'Firingi Bazaar Haleem House',
      description: 'Best haleem in Chittagong.',
      address: 'Firingi Bazaar, Chittagong',
      latitude: 22.343,
      longitude: 91.838,
      status: 'approved',
      admin_note: 'Verified.',
    },
    {
      suggested_by: users[3].id,
      name: 'Lalkhan Bazaar Shingara Stall',
      description: 'Iconic shingara stall.',
      address: 'Lalkhan Bazaar, Chittagong',
      latitude: 22.355,
      longitude: 91.826,
      status: 'approved',
      admin_note: 'Classic spot.',
    },
    {
      suggested_by: users[4].id,
      name: 'Pahartali Biryani House',
      description: 'Best kacchi biryani near Pahartali.',
      address: 'Pahartali, Chittagong',
      latitude: 22.381,
      longitude: 91.796,
      status: 'rejected',
      admin_note: 'This is a restaurant, not street food.',
    },
    {
      suggested_by: users[5].id,
      name: 'Oxygen Mora Piaju Corner',
      description: 'Evening piaju and beguni stall.',
      address: 'Oxygen, Chittagong',
      latitude: 22.362,
      longitude: 91.805,
      status: 'pending',
    },
    {
      suggested_by: users[6].id,
      name: 'Patenga Beach Jhalmuri',
      description: 'Spicy jhalmuri at Patenga beach.',
      address: 'Patenga Beach, Chittagong',
      latitude: 22.236,
      longitude: 91.7915,
      status: 'pending',
    },
    {
      suggested_by: users[7].id,
      name: 'Sadarghat Kabab Point',
      description: 'Seekh kabab near Sadarghat.',
      address: 'Sadarghat, Chittagong',
      latitude: 22.338,
      longitude: 91.841,
      status: 'approved',
      admin_note: 'Adding soon.',
    },
    {
      suggested_by: users[8].id,
      name: 'Chawkbazar Corn Cart',
      description: 'Roasted corn cart near Chawkbazar.',
      address: 'Chawkbazar, Chittagong',
      latitude: 22.3475,
      longitude: 91.833,
      status: 'pending',
    },
    {
      suggested_by: users[9].id,
      name: 'Reazuddin Bazaar Fruit Chaat',
      description: 'Fresh fruit chaat stall.',
      address: 'Reazuddin Bazaar, Chittagong',
      latitude: 22.339,
      longitude: 91.835,
      status: 'pending',
    },
  ];
  for (const s of suggestionsData) {
    const ex = await prisma.storeSuggestion.findFirst({
      where: { name: s.name, suggested_by: s.suggested_by },
    });
    if (!ex) await prisma.storeSuggestion.create({ data: s });
  }
  console.log(`  ✅ ${suggestionsData.length} suggestions`);

  // ── Store claims ──
  console.log('\n🏷️  Claims…');
  const claimsData = [
    {
      store_id: stores[8].id,
      claimed_by: users[3].id,
      message: '25 years selling mishti doi in Halishahar.',
      status: 'pending',
    },
    {
      store_id: stores[9].id,
      claimed_by: users[5].id,
      message: 'My lassi stall in Khatunganj since 2015.',
      status: 'pending',
    },
    {
      store_id: stores[10].id,
      claimed_by: users[8].id,
      message: 'My family owns this pitha house in Sitakunda.',
      status: 'approved',
      admin_note: 'Verified via phone call.',
    },
    {
      store_id: stores[11].id,
      claimed_by: users[11].id,
      message: 'Owner of fish BBQ stall at Mirsharai beach.',
      status: 'rejected',
      admin_note: 'Could not verify ownership.',
    },
    {
      store_id: stores[8].id,
      claimed_by: users[7].id,
      message: 'I work here and manage the doi stall.',
      status: 'rejected',
      admin_note: 'Only the owner can claim.',
    },
  ];
  for (const c of claimsData) {
    await prisma.storeClaim.upsert({
      where: {
        store_id_claimed_by: { store_id: c.store_id, claimed_by: c.claimed_by },
      },
      update: { status: c.status, admin_note: (c as any).admin_note },
      create: c,
    });
  }
  console.log(`  ✅ ${claimsData.length} claims`);

  // ── Done ──
  console.log('\n════════════════════════════════════');
  console.log('✅ SEED COMPLETE — no data deleted');
  console.log('════════════════════════════════════\n');
  console.log('  admin@streetfood.com   / Admin@123456');
  console.log('  alice@example.com      / User@1234');
  console.log('  ravi@momos.com         / Store@1234\n');
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
