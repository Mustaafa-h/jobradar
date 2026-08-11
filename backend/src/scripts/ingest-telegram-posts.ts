import { NestFactory } from '@nestjs/core';
import { TelegramClient } from '@mtcute/node';
import { AppModule } from '../app.module';
import { PrismaService } from '../database/prisma.service';

const INITIAL_LOOKBACK_HOURS = 24;

function requireEnvironmentVariable(name: string): string {
    const value = process.env[name];

    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
}

function formatError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

async function main(): Promise<void> {
    const application = await NestFactory.createApplicationContext(AppModule);

    const prisma = application.get(PrismaService);
    const apiId = Number.parseInt(
        requireEnvironmentVariable('TELEGRAM_API_ID'),
        10,
    );

    if (!Number.isSafeInteger(apiId)) {
        throw new Error('TELEGRAM_API_ID must be a valid integer');
    }

    const telegram = new TelegramClient({
        apiId,
        apiHash: requireEnvironmentVariable('TELEGRAM_API_HASH'),
        storage: requireEnvironmentVariable('TELEGRAM_SESSION_PATH'),
    });

    let totalSaved = 0;

    try {
        await telegram.start();

        const channels = await prisma.channel.findMany({
            where: { enabled: true },
            include: { checkpoint: true },
            orderBy: { title: 'asc' },
        });

        console.log(`Starting ingestion for ${channels.length} channels`);

        for (const channel of channels) {
            try {
                const markedChannelId = Number(channel.telegramId);

                if (!Number.isSafeInteger(markedChannelId)) {
                    throw new Error(`Unsafe Telegram ID: ${channel.telegramId}`);
                }


                const previousMessageId = channel.checkpoint?.lastMessageId;
                const cutoff = new Date(
                    Date.now() - INITIAL_LOOKBACK_HOURS * 60 * 60 * 1000,
                );

                let newestMessageId = previousMessageId ?? 0n;
                let savedForChannel = 0;
                for await (const message of telegram.iterHistory(markedChannelId, {
                    minId: previousMessageId
                        ? Number(previousMessageId)
                        : undefined,
                })) {
                    if (!previousMessageId && message.date < cutoff) {
                        break;
                    }

                    if (BigInt(message.id) > newestMessageId) {
                        newestMessageId = BigInt(message.id);
                    }

                    const text = message.text.trim();

                    if (text.length === 0) {
                        continue;
                    }

                    const sourceUrl = channel.username
                        ? `https://t.me/${channel.username}/${message.id}`
                        : null;

                    await prisma.telegramPost.upsert({
                        where: {
                            channelId_telegramMessageId: {
                                channelId: channel.id,
                                telegramMessageId: BigInt(message.id),
                            },
                        },
                        update: {
                            text,
                            postedAt: message.date,
                            sourceUrl,
                        },
                        create: {
                            channelId: channel.id,
                            telegramMessageId: BigInt(message.id),
                            text,
                            postedAt: message.date,
                            sourceUrl,
                        },
                    });

                    savedForChannel += 1;
                }

                await prisma.ingestionCheckpoint.upsert({
                    where: { channelId: channel.id },
                    update: {
                        lastMessageId: newestMessageId,
                        lastCheckedAt: new Date(),
                    },
                    create: {
                        channelId: channel.id,
                        lastMessageId: newestMessageId,
                        lastCheckedAt: new Date(),
                    },
                });



                totalSaved += savedForChannel;

                console.log(`${channel.title}: saved ${savedForChannel} posts`);
            } catch (error: unknown) {
                console.error(`${channel.title}: ${formatError(error)}`);
            }
        }

        console.log(`Ingestion completed; saved ${totalSaved} posts`);
    } finally {
        await telegram.destroy();
        await application.close();
    }
}

void main().catch((error: unknown) => {
    console.error(`Telegram ingestion failed: ${formatError(error)}`);
    process.exitCode = 1;
});