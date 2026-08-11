-- CreateTable
CREATE TABLE "telegram_posts" (
    "id" TEXT NOT NULL,
    "channelId" UUID NOT NULL,
    "telegramMessageId" BIGINT NOT NULL,
    "text" TEXT NOT NULL,
    "postedAt" TIMESTAMP(3) NOT NULL,
    "sourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telegram_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "telegram_posts_postedAt_idx" ON "telegram_posts"("postedAt");

-- CreateIndex
CREATE UNIQUE INDEX "telegram_posts_channelId_telegramMessageId_key" ON "telegram_posts"("channelId", "telegramMessageId");

-- AddForeignKey
ALTER TABLE "telegram_posts" ADD CONSTRAINT "telegram_posts_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
