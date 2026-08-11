import { Module } from '@nestjs/common';
import { JobMatcherService } from './job-matcher.service';

@Module({
  providers: [JobMatcherService],
  exports: [JobMatcherService],
})
export class MatchingModule {}