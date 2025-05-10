import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { BullModule } from '@nestjs/bull';
import { diskStorage } from 'multer';
import { v4 as uuid } from 'uuid';

import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { PromptModule } from '../prompt/prompt.module';
import { PromptService } from '../prompt/prompt.service';

@Module({
  imports: [
    PromptModule,
    BullModule.registerQueue({ name: 'simplify' }),
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (_, file, cb) =>
          cb(null, `${uuid()}.${file.originalname.split('.').pop()}`),
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, PromptService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
