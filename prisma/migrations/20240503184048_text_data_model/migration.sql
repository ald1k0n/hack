-- CreateTable
CREATE TABLE "Text_Data" (
    "id" TEXT NOT NULL,
    "word" TEXT NOT NULL,

    CONSTRAINT "Text_Data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Text_Data_id_key" ON "Text_Data"("id");
