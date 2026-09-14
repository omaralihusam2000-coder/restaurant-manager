import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const db = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Clean slate for repeatable seeding in dev.
  await db.shift.deleteMany();
  await db.payment.deleteMany();
  await db.orderItemModifier.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.menuItemModifierGroup.deleteMany();
  await db.modifier.deleteMany();
  await db.modifierGroup.deleteMany();
  await db.menuItem.deleteMany();
  await db.category.deleteMany();
  await db.table.deleteMany();
  await db.inventoryItem.deleteMany();
  await db.user.deleteMany();
  await db.restaurant.deleteMany();

  const restaurant = await db.restaurant.create({
    data: {
      name: "مطعم لمّة",
      logoEmoji: "🍽️",
      currency: "IQD",
      taxRate: 0,
      address: "شارع الرشيد، بغداد",
      phone: "07901234567",
    },
  });

  const passwordHash = await bcrypt.hash("password123", 10);

  await db.user.createMany({
    data: [
      {
        name: "مدير المطعم",
        email: "admin@lamma.com",
        passwordHash,
        role: "OWNER",
        restaurantId: restaurant.id,
      },
      {
        name: "أمين الصندوق",
        email: "cashier@lamma.com",
        passwordHash,
        role: "CASHIER",
        restaurantId: restaurant.id,
      },
      {
        name: "نادل",
        email: "waiter@lamma.com",
        passwordHash,
        role: "WAITER",
        restaurantId: restaurant.id,
      },
      {
        name: "شيف",
        email: "kitchen@lamma.com",
        passwordHash,
        role: "KITCHEN",
        restaurantId: restaurant.id,
      },
    ],
  });

  const categoriesData = [
    { nameAr: "المقبلات", nameEn: "Appetizers", emoji: "🥗", sortOrder: 1 },
    { nameAr: "الأطباق الرئيسية", nameEn: "Main Dishes", emoji: "🍛", sortOrder: 2 },
    { nameAr: "المشويات", nameEn: "Grills", emoji: "🍢", sortOrder: 3 },
    { nameAr: "المشروبات", nameEn: "Drinks", emoji: "🥤", sortOrder: 4 },
    { nameAr: "الحلويات", nameEn: "Desserts", emoji: "🍰", sortOrder: 5 },
  ];

  const categories: Record<string, string> = {};
  for (const c of categoriesData) {
    const created = await db.category.create({
      data: { ...c, restaurantId: restaurant.id },
    });
    categories[c.nameEn] = created.id;
  }

  const sizeGroup = await db.modifierGroup.create({
    data: {
      nameAr: "الحجم",
      nameEn: "Size",
      required: true,
      multiSelect: false,
      restaurantId: restaurant.id,
      modifiers: {
        create: [
          { nameAr: "صغير", nameEn: "Small", priceDelta: 0 },
          { nameAr: "وسط", nameEn: "Medium", priceDelta: 1000 },
          { nameAr: "كبير", nameEn: "Large", priceDelta: 2000 },
        ],
      },
    },
  });

  const extrasGroup = await db.modifierGroup.create({
    data: {
      nameAr: "إضافات",
      nameEn: "Extras",
      required: false,
      multiSelect: true,
      restaurantId: restaurant.id,
      modifiers: {
        create: [
          { nameAr: "جبنة إضافية", nameEn: "Extra Cheese", priceDelta: 1500 },
          { nameAr: "صوص حار", nameEn: "Spicy Sauce", priceDelta: 500 },
          { nameAr: "بدون بصل", nameEn: "No Onion", priceDelta: 0 },
        ],
      },
    },
  });

  const items: {
    nameAr: string;
    nameEn: string;
    price: number;
    cost: number;
    emoji: string;
    category: string;
    modifierGroups?: string[];
  }[] = [
    { nameAr: "حمص", nameEn: "Hummus", price: 4000, cost: 1500, emoji: "🥙", category: "Appetizers" },
    { nameAr: "متبل", nameEn: "Mutabbal", price: 4000, cost: 1500, emoji: "🍆", category: "Appetizers" },
    { nameAr: "سلطة فتوش", nameEn: "Fattoush Salad", price: 5000, cost: 2000, emoji: "🥗", category: "Appetizers" },
    { nameAr: "بطاطس مقلية", nameEn: "French Fries", price: 3000, cost: 1000, emoji: "🍟", category: "Appetizers", modifierGroups: ["Size"] },
    { nameAr: "كبسة دجاج", nameEn: "Chicken Kabsa", price: 12000, cost: 5000, emoji: "🍛", category: "Main Dishes" },
    { nameAr: "مندي لحم", nameEn: "Lamb Mandi", price: 20000, cost: 9000, emoji: "🍖", category: "Main Dishes" },
    { nameAr: "برياني دجاج", nameEn: "Chicken Biryani", price: 10000, cost: 4000, emoji: "🍚", category: "Main Dishes" },
    { nameAr: "برجر لحم", nameEn: "Beef Burger", price: 8000, cost: 3500, emoji: "🍔", category: "Main Dishes", modifierGroups: ["Size", "Extras"] },
    { nameAr: "بيتزا خضار", nameEn: "Veggie Pizza", price: 9000, cost: 3500, emoji: "🍕", category: "Main Dishes", modifierGroups: ["Size", "Extras"] },
    { nameAr: "شيش طاووق", nameEn: "Shish Tawook", price: 9000, cost: 3500, emoji: "🍢", category: "Grills" },
    { nameAr: "كباب لحم", nameEn: "Kebab", price: 11000, cost: 5000, emoji: "🍢", category: "Grills" },
    { nameAr: "ريش غنم", nameEn: "Lamb Chops", price: 18000, cost: 8000, emoji: "🍖", category: "Grills" },
    { nameAr: "دجاج مشوي", nameEn: "Grilled Chicken", price: 10000, cost: 4200, emoji: "🍗", category: "Grills" },
    { nameAr: "عصير برتقال", nameEn: "Orange Juice", price: 2000, cost: 500, emoji: "🍊", category: "Drinks" },
    { nameAr: "ليموناضة نعناع", nameEn: "Mint Lemonade", price: 2500, cost: 600, emoji: "🍋", category: "Drinks" },
    { nameAr: "شاي أحمر", nameEn: "Black Tea", price: 1000, cost: 200, emoji: "🍵", category: "Drinks" },
    { nameAr: "قهوة عربية", nameEn: "Arabic Coffee", price: 1500, cost: 400, emoji: "☕", category: "Drinks" },
    { nameAr: "مشروب غازي", nameEn: "Soft Drink", price: 1000, cost: 400, emoji: "🥤", category: "Drinks" },
    { nameAr: "كنافة", nameEn: "Kunafa", price: 5000, cost: 2000, emoji: "🍰", category: "Desserts" },
    { nameAr: "أم علي", nameEn: "Om Ali", price: 4500, cost: 1800, emoji: "🍮", category: "Desserts" },
    { nameAr: "بسبوسة", nameEn: "Basbousa", price: 3500, cost: 1200, emoji: "🧁", category: "Desserts" },
  ];

  const modifierGroupsMap: Record<string, string> = {
    Size: sizeGroup.id,
    Extras: extrasGroup.id,
  };

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    await db.menuItem.create({
      data: {
        nameAr: item.nameAr,
        nameEn: item.nameEn,
        price: item.price,
        cost: item.cost,
        emoji: item.emoji,
        sortOrder: i,
        categoryId: categories[item.category],
        restaurantId: restaurant.id,
        modifierGroups: item.modifierGroups
          ? {
              create: item.modifierGroups.map((g) => ({
                modifierGroupId: modifierGroupsMap[g],
              })),
            }
          : undefined,
      },
    });
  }

  const tablesData = [
    { label: "1", zone: "الصالة الرئيسية", seats: 2, posX: 0, posY: 0 },
    { label: "2", zone: "الصالة الرئيسية", seats: 2, posX: 1, posY: 0 },
    { label: "3", zone: "الصالة الرئيسية", seats: 4, posX: 2, posY: 0 },
    { label: "4", zone: "الصالة الرئيسية", seats: 4, posX: 3, posY: 0 },
    { label: "5", zone: "الصالة الرئيسية", seats: 4, posX: 0, posY: 1 },
    { label: "6", zone: "الصالة الرئيسية", seats: 6, posX: 1, posY: 1 },
    { label: "7", zone: "التراس", seats: 2, posX: 0, posY: 2 },
    { label: "8", zone: "التراس", seats: 2, posX: 1, posY: 2 },
    { label: "9", zone: "التراس", seats: 4, posX: 2, posY: 2 },
    { label: "10", zone: "غرفة VIP", seats: 8, posX: 0, posY: 3 },
  ];

  await db.table.createMany({
    data: tablesData.map((t) => ({ ...t, restaurantId: restaurant.id })),
  });

  await db.inventoryItem.createMany({
    data: [
      { nameAr: "أرز بسمتي", nameEn: "Basmati Rice", unit: "كجم", unitEn: "kg", quantity: 40, lowStockAt: 10, restaurantId: restaurant.id },
      { nameAr: "دجاج", nameEn: "Chicken", unit: "كجم", unitEn: "kg", quantity: 25, lowStockAt: 8, restaurantId: restaurant.id },
      { nameAr: "لحم غنم", nameEn: "Lamb", unit: "كجم", unitEn: "kg", quantity: 6, lowStockAt: 8, restaurantId: restaurant.id },
      { nameAr: "خبز", nameEn: "Bread", unit: "ربطة", unitEn: "pack", quantity: 3, lowStockAt: 5, restaurantId: restaurant.id },
      { nameAr: "طماطم", nameEn: "Tomatoes", unit: "كجم", unitEn: "kg", quantity: 15, lowStockAt: 5, restaurantId: restaurant.id },
    ],
  });

  // Historical demo orders so the dashboard has something to show.
  const allItems = await db.menuItem.findMany();
  const allUsers = await db.user.findMany();
  const cashier = allUsers.find((u) => u.role === "CASHIER") ?? allUsers[0];

  let orderCounter = 1;
  const now = new Date();
  for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
    const ordersToday = 6 + Math.floor(Math.random() * 10);
    for (let n = 0; n < ordersToday; n++) {
      const day = new Date(now);
      day.setDate(day.getDate() - dayOffset);
      day.setHours(11 + Math.floor(Math.random() * 11), Math.floor(Math.random() * 60), 0, 0);

      const numLines = 1 + Math.floor(Math.random() * 4);
      const lines: { menuItemId: string; quantity: number; unitPrice: number }[] = [];
      let subtotal = 0;
      for (let l = 0; l < numLines; l++) {
        const mi = allItems[Math.floor(Math.random() * allItems.length)];
        const qty = 1 + Math.floor(Math.random() * 3);
        subtotal += mi.price * qty;
        lines.push({ menuItemId: mi.id, quantity: qty, unitPrice: mi.price });
      }
      const taxRate = restaurant.taxRate / 100;
      const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
      const total = Math.round((subtotal + taxAmount) * 100) / 100;
      const type = ["DINE_IN", "TAKEAWAY", "DELIVERY"][Math.floor(Math.random() * 3)] as
        | "DINE_IN"
        | "TAKEAWAY"
        | "DELIVERY";

      await db.order.create({
        data: {
          orderNumber: orderCounter++,
          type,
          status: "PAID",
          subtotal,
          taxAmount,
          discount: 0,
          total,
          createdAt: day,
          updatedAt: day,
          paidAt: day,
          restaurantId: restaurant.id,
          userId: cashier?.id,
          items: { create: lines },
          payments: {
            create: {
              method: Math.random() > 0.4 ? "CASH" : "CARD",
              amount: total,
              tenderedAmount: total,
              changeAmount: 0,
              createdAt: day,
            },
          },
        },
      });
    }
  }

  console.log(`✅ Seeded restaurant "${restaurant.name}" with ${orderCounter - 1} historical orders.`);
  console.log("\nDemo accounts (password: password123):");
  console.log("  Owner:   admin@lamma.com");
  console.log("  Cashier: cashier@lamma.com");
  console.log("  Waiter:  waiter@lamma.com");
  console.log("  Kitchen: kitchen@lamma.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
