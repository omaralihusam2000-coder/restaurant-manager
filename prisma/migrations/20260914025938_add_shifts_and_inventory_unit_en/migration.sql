-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "openingCash" REAL NOT NULL,
    "closingCash" REAL,
    "expectedCash" REAL,
    "notes" TEXT,
    "openedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    "restaurantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Shift_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Shift_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'قطعة',
    "unitEn" TEXT NOT NULL DEFAULT 'pcs',
    "quantity" REAL NOT NULL DEFAULT 0,
    "lowStockAt" REAL NOT NULL DEFAULT 5,
    "updatedAt" DATETIME NOT NULL,
    "restaurantId" TEXT NOT NULL,
    CONSTRAINT "InventoryItem_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_InventoryItem" ("id", "lowStockAt", "nameAr", "nameEn", "quantity", "restaurantId", "unit", "updatedAt") SELECT "id", "lowStockAt", "nameAr", "nameEn", "quantity", "restaurantId", "unit", "updatedAt" FROM "InventoryItem";
DROP TABLE "InventoryItem";
ALTER TABLE "new_InventoryItem" RENAME TO "InventoryItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
