-- CreateTable
CREATE TABLE "User" (
    "uuid" TEXT NOT NULL PRIMARY KEY,
    "id" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "islandName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Island" (
    "uuid" TEXT NOT NULL PRIMARY KEY,
    CONSTRAINT "Island_uuid_fkey" FOREIGN KEY ("uuid") REFERENCES "User" ("uuid") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_uuid_key" ON "User"("uuid");
