import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { ChannelsModule } from './channels/channels.module';
import { MatchingModule } from './matching/matching.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DigestModule } from './digest/digest.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    HealthModule,
    ChannelsModule,
    MatchingModule,
    NotificationsModule,
    DigestModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}