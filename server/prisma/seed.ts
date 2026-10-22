import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, PetType } from "@prisma/client";

const prisma = new PrismaClient();

function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env variable: ${name}`);
  return v;
}

async function category(name: string, slug: string, parentId?: string) {
  return prisma.category.upsert({
    where: { slug },
    update: { name, parentId: parentId ?? null },
    create: { name, slug, parentId: parentId ?? null },
  });
}

async function main() {
  // Store settings (single row)
  await prisma.storeSetting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      storeName: "PawNest",
      supportEmail: "support@pawnest.com",
      phone: "+91 98765 43210",
      address: "Jaipur, Rajasthan, India",
    },
  });

  // Users

const adminEmail = need("SEED_ADMIN_EMAIL");
const adminHash = await bcrypt.hash(need("SEED_ADMIN_PASSWORD"), 12);

await prisma.user.upsert({
  where: { email: adminEmail },
  update: {
    passwordHash: adminHash,
    role: "ADMIN",
    name: "Admin",
  },
  create: {
    email: adminEmail,
    passwordHash: adminHash,
    name: "Admin",
    role: "ADMIN",
    emailVerifiedAt: new Date(),
  },
});


  const customerHash = await bcrypt.hash(need("SEED_CUSTOMER_PASSWORD"), 12);
  const customer = await prisma.user.upsert({
    where: { email: need("SEED_CUSTOMER_EMAIL") },
    update: {},
    create: {
      email: need("SEED_CUSTOMER_EMAIL"),
      passwordHash: customerHash,
      name: "Rahul Sharma",
      phone: "+91 98765 43210",
      emailVerifiedAt: new Date(),
    },
  });

  if ((await prisma.pet.count({ where: { userId: customer.id } })) === 0) {
    await prisma.pet.createMany({
      data: [
        { userId: customer.id, name: "Bruno", type: PetType.DOG, breed: "Golden Retriever",
          birthDate: new Date("2023-10-01"), weightKg: 28 },
        { userId: customer.id, name: "Misty", type: PetType.CAT, breed: "Persian Cat",
          birthDate: new Date("2024-10-01"), weightKg: 4 },
      ],
    });
  }

  // Categories
  const dogFood = await category("Dog Food", "dog-food");
  const dry = await category("Dry Food", "dry-food", dogFood.id);
  await category("Wet Food", "wet-food", dogFood.id);
  await category("Puppy Food", "puppy-food", dogFood.id);
  const catFood = await category("Cat Food", "cat-food");
  const toys = await category("Toys", "toys");
  const accessories = await category("Accessories", "accessories");
  const birdFood = await category("Bird Food", "bird-food");
  const fishFood = await category("Fish Food", "fish-food");
  const bedding = await category("Bedding", "bedding");

  // Products (prices in paise)
  const products = [
    { name: "Royal Canin Adult Dog Food", slug: "royal-canin-adult-dog-food", brand: "Royal Canin",
      petType: PetType.DOG, categoryId: dry.id, isActive: true,
      description: "Complete and balanced nutrition for adult dogs.",
      variants: [
        { label: "1 kg", sku: "RC-ADF-1KG", pricePaise: 125000, stockQty: 24 },
        { label: "3 kg", sku: "RC-ADF-3KG", pricePaise: 289900, stockQty: 18 },
      ] },
    { name: "Kong Chew Toy", slug: "kong-chew-toy", brand: "Kong", petType: PetType.DOG,
      categoryId: toys.id, isActive: true, description: "Durable rubber chew toy for dogs.",
      variants: [{ label: "Medium", sku: "KONG-CT-002", pricePaise: 65000, stockQty: 12 }] },
    { name: "Whiskas Adult Cat Food", slug: "whiskas-adult-cat-food", brand: "Whiskas",
      petType: PetType.CAT, categoryId: catFood.id, isActive: true,
      description: "Tasty and nutritious food for adult cats.",
      variants: [{ label: "Standard", sku: "WH-CF-003", pricePaise: 89900, stockQty: 8 }] },
    { name: "Stainless Steel Pet Bowl", slug: "stainless-steel-pet-bowl", brand: "PawNest",
      petType: PetType.DOG, categoryId: accessories.id, isActive: true,
      description: "Easy to clean stainless steel bowl.",
      variants: [{ label: "Medium", sku: "SS-PB-004", pricePaise: 45000, stockQty: 36 }] },
    { name: "Cat Scratching Post", slug: "cat-scratching-post", brand: "PawNest",
      petType: PetType.CAT, categoryId: toys.id, isActive: false,
      description: "Sturdy scratching post for cats.",
      variants: [{ label: "Standard", sku: "CSP-005", pricePaise: 199900, stockQty: 5 }] },
    { name: "Premium Bird Seed Mix", slug: "premium-bird-seed-mix", brand: "PawNest",
      petType: PetType.BIRD, categoryId: birdFood.id, isActive: true,
      description: "Seed mix for small and medium birds.",
      variants: [{ label: "Standard", sku: "BSM-006", pricePaise: 32000, stockQty: 50 }] },
    { name: "Aqua Life Fish Food Pellets", slug: "aqua-life-fish-food-pellets", brand: "Aqua Life",
      petType: PetType.FISH, categoryId: fishFood.id, isActive: true,
      description: "Floating pellets for aquarium fish.",
      variants: [{ label: "Standard", sku: "AL-FF-007", pricePaise: 28000, stockQty: 18 }] },
    { name: "Soft Bedding for Small Pets", slug: "soft-bedding-small-pets", brand: "PawNest",
      petType: PetType.SMALL_PET, categoryId: bedding.id, isActive: false,
      description: "Soft and absorbent bedding for small pets.",
      variants: [{ label: "Standard", sku: "SBSP-008", pricePaise: 49900, stockQty: 3 }] },
  ];

  for (const p of products) {
    const { variants, ...data } = p;
    const created = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: data,
    });
    for (const v of variants) {
      await prisma.productVariant.upsert({
        where: { sku: v.sku },
        update: {},
        create: { ...v, productId: created.id },
      });
    }
  }

  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());