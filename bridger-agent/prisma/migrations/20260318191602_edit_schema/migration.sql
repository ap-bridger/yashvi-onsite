-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "client_id" TEXT NOT NULL,
    "qb_id" TEXT,
    "account_id" TEXT,
    "amount" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bank_desc" TEXT NOT NULL,
    "vendor" TEXT,
    "category_id" TEXT,
    "confidence_category" REAL,
    "confidence_vendor" REAL,
    "review_status" TEXT NOT NULL DEFAULT 'NONE',
    CONSTRAINT "Transaction_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transaction_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("account_id", "amount", "bank_desc", "category_id", "client_id", "confidence_category", "confidence_vendor", "created_at", "id", "qb_id", "review_status", "vendor") SELECT "account_id", "amount", "bank_desc", "category_id", "client_id", "confidence_category", "confidence_vendor", "created_at", "id", "qb_id", "review_status", "vendor" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE INDEX "Transaction_client_id_idx" ON "Transaction"("client_id");
CREATE INDEX "Transaction_client_id_category_id_idx" ON "Transaction"("client_id", "category_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
