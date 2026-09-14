-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Restaurant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "logoEmoji" TEXT NOT NULL DEFAULT '🍽️',
    "currency" TEXT NOT NULL DEFAULT 'IQD',
    "taxRate" REAL NOT NULL DEFAULT 0,
    "address" TEXT,
    "phone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Restaurant" ("address", "createdAt", "currency", "id", "logoEmoji", "name", "phone", "taxRate", "updatedAt") SELECT "address", "createdAt", "currency", "id", "logoEmoji", "name", "phone", "taxRate", "updatedAt" FROM "Restaurant";
DROP TABLE "Restaurant";
ALTER TABLE "new_Restaurant" RENAME TO "Restaurant";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
