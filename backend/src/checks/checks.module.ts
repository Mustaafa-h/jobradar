import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChecksController } from './checks.controller';
import { ChecksService } from './checks.service';

@Module({
  imports: [ConfigModule],
  controllers: [ChecksController],
  providers: [ChecksService],
})
export class ChecksModule {}