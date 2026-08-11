import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../database/prisma.service';
import { MatchLevel } from '../generated/prisma/enums';
import { JobMatcherService } from '../matching/job-matcher.service';

async function main(): Promise<void> {
  const application = await NestFactory.createApplicationContext(AppModule);

  try {
    const prisma = application.get(PrismaService);
    const matcher = application.get(JobMatcherService);
    const classifyAll = process.argv.includes('--all');

    const posts = await prisma.telegramPost.findMany({
      where: classifyAll
        ? {}
        : {
            matchLevel: null,
          },
      orderBy: {
        postedAt: 'asc',
      },
    });

    const counts: Record<MatchLevel, number> = {
      [MatchLevel.STRONG]: 0,
      [MatchLevel.GOOD]: 0,
      [MatchLevel.STRETCH]: 0,
      [MatchLevel.NOT_RELEVANT]: 0,
    };

    for (const post of posts) {
      const matchLevel = matcher.classify(post.text);

      await prisma.telegramPost.update({
        where: {
          id: post.id,
        },
        data: {
          matchLevel,
          classifiedAt: new Date(),
        },
      });

      counts[matchLevel] += 1;
    }

    console.log(`Classified ${posts.length} posts`);
    console.log(`Strong: ${counts[MatchLevel.STRONG]}`);
    console.log(`Good: ${counts[MatchLevel.GOOD]}`);
    console.log(`Stretch: ${counts[MatchLevel.STRETCH]}`);
    console.log(`Not relevant: ${counts[MatchLevel.NOT_RELEVANT]}`);
  } finally {
    await application.close();
  }
}

void main().catch((error: unknown) => {
  console.error(
    'Classification failed:',
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});