import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../database/prisma.service';

const RETENTION_DAYS = 7;

async function main(): Promise<void> {
  const application = await NestFactory.createApplicationContext(AppModule);

  try {
    const prisma = application.get(PrismaService);
    const cutoff = new Date(
      Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000,
    );

    const result = await prisma.telegramPost.deleteMany({
      where: {
        postedAt: {
          lt: cutoff,
        },
      },
    });

    console.log(
      `Cleanup completed; deleted ${result.count} posts older than ${RETENTION_DAYS} days`,
    );
  } finally {
    await application.close();
  }
}

void main().catch((error: unknown) => {
  console.error(
    'Cleanup failed:',
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});