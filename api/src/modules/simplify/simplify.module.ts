import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { SimplifyProcessor } from './simplify.processor';
import { PromptModule } from '../prompt/prompt.module';
import { PromptService } from '../prompt/prompt.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'simplify' }),
    PromptModule,
    PrismaModule,
  ],
  providers: [SimplifyProcessor, PromptService],
})
export class SimplifyModule {}
