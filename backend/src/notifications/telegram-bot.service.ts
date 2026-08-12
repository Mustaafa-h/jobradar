import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface TelegramApiResponse {
  ok: boolean;
  description?: string;
}

@Injectable()
export class TelegramBotService {
  constructor(private readonly configService: ConfigService) {}

  async sendMessage(text: string): Promise<void> {
    const token =
      this.configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN');
    const chatId = this.configService.getOrThrow<string>(
      'TELEGRAM_DIGEST_CHAT_ID',
    );

    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          disable_web_page_preview: false,
        }),
      },
    );

    const result = (await response.json()) as TelegramApiResponse;

    if (!response.ok || !result.ok) {
      throw new Error(
        result.description ?? `Telegram API returned ${response.status}`,
      );
    }
  }
}