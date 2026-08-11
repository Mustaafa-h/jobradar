-- CreateTable
CREATE TABLE "channels" (
    "id" UUID NOT NULL,
    "telegram_id" BIGINT NOT NULL,
    "username" TEXT,
    "title" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingestion_checkpoints" (
    "channel_id" UUID NOT NULL,
    "last_message_id" BIGINT NOT NULL DEFAULT 0,
    "last_checked_at" TIMESTAMP(3),

    CONSTRAINT "ingestion_checkpoints_pkey" PRIMARY KEY ("channel_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "channels_telegram_id_key" ON "channels"("telegram_id");

-- CreateIndex
CREATE UNIQUE INDEX "channels_username_key" ON "channels"("username");

-- AddForeignKey
ALTER TABLE "ingestion_checkpoints" ADD CONSTRAINT "ingestion_checkpoints_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
