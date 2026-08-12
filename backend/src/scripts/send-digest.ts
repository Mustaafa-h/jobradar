import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DigestService } from '../digest/digest.service';

async function main(): Promise<void> {
  const application = await NestFactory.createApplicationContext(AppModule);

  try {
    const digestService = application.get(DigestService);
    await digestService.sendPendingDigest();
  } finally {
    await application.close();
  }
}

void main().catch((error: unknown) => {
  console.error(
    'Digest failed:',
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});