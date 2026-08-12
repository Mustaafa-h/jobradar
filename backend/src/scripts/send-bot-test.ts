import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TelegramBotService } from '../notifications/telegram-bot.service';

async function main(): Promise<void> {
  const application = await NestFactory.createApplicationContext(AppModule);

  try {
    const telegramBot = application.get(TelegramBotService);

    await telegramBot.sendMessage(
      '✅ JobRadar bot connection is working.\n\nYour private digest delivery is ready.',
    );

    console.log('Telegram test message sent successfully');
  } finally {
    await application.close();
  }
}

void main().catch((error: unknown) => {
  console.error(
    'Telegram test failed:',
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});