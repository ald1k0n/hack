-- CreateTable
CREATE TABLE "Ban_Word" (
    "id" TEXT NOT NULL,
    "word" TEXT NOT NULL,

    CONSTRAINT "Ban_Word_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ban_Word_id_key" ON "Ban_Word"("id");
