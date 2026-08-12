import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { MatchLevel } from '../generated/prisma/enums';
import { TelegramBotService } from '../notifications/telegram-bot.service';

@Injectable()
export class DigestService {
  private readonly maximumJobs = 10;

  private readonly labels: Record<MatchLevel, string> = {
    [MatchLevel.STRONG]: '🟢 Strong',
    [MatchLevel.GOOD]: '🔵 Good',
    [MatchLevel.STRETCH]: '🟠 Stretch',
    [MatchLevel.NOT_RELEVANT]: 'Not relevant',
  };

  private readonly priority: Record<MatchLevel, number> = {
    [MatchLevel.STRONG]: 1,
    [MatchLevel.GOOD]: 2,
    [MatchLevel.STRETCH]: 3,
    [MatchLevel.NOT_RELEVANT]: 4,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramBot: TelegramBotService,
  ) {}

  async sendPendingDigest(): Promise<number> {
    const candidates = await this.prisma.telegramPost.findMany({
      where: {
        deliveredAt: null,
        matchLevel: {
          in: [
            MatchLevel.STRONG,
            MatchLevel.GOOD,
            MatchLevel.STRETCH,
          ],
        },
      },
      include: {
        channel: true,
      },
      orderBy: {
        postedAt: 'desc',
      },
      take: 100,
    });

    const jobs = candidates
      .sort((first, second) => {
        const firstLevel = first.matchLevel as MatchLevel;
        const secondLevel = second.matchLevel as MatchLevel;
        const priorityDifference =
          this.priority[firstLevel] - this.priority[secondLevel];

        if (priorityDifference !== 0) {
          return priorityDifference;
        }

        return second.postedAt.getTime() - first.postedAt.getTime();
      })
      .slice(0, this.maximumJobs);

    if (jobs.length === 0) {
      console.log('No undelivered relevant jobs; digest not sent');
      return 0;
    }

    await this.telegramBot.sendMessage(
      `📡 JobRadar Digest\n\n${jobs.length} relevant job${jobs.length === 1 ? '' : 's'} found`,
    );

    for (const job of jobs) {
      const matchLevel = job.matchLevel as MatchLevel;
      const postedAt = new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Baghdad',
      }).format(job.postedAt);

      const shortenedText =
        job.text.length > 3400
          ? `${job.text.slice(0, 3400)}\n\n[Post shortened]`
          : job.text;

      const source = job.sourceUrl
        ? `\n\nSource: ${job.sourceUrl}`
        : '';

      const message = [
        this.labels[matchLevel],
        `Channel: ${job.channel.title}`,
        `Posted: ${postedAt}`,
        '',
        shortenedText,
        source,
      ].join('\n');

      await this.telegramBot.sendMessage(message);

      await this.prisma.telegramPost.update({
        where: { id: job.id },
        data: { deliveredAt: new Date() },
      });
    }

    console.log(`Digest sent with ${jobs.length} jobs`);
    return jobs.length;
  }
}