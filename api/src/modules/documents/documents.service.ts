import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { PromptService } from '../prompt/prompt.service';
import { CreateDocumentDto } from './dto/create-document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly prompts: PromptService,
    @InjectQueue('simplify') private readonly queue: Queue,
  ) {}

  storeFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File not provided');
    }

    const [ext] = file.originalname.split('.').reverse();

    return {
      originalName: file.originalname,
      mimeType: file.mimetype,
      ext,
      size: file.size,
      path: file.path,
    };
  }

  async create(dto: CreateDocumentDto, userId: string) {
    if (!dto.audience) {
      dto.audience = 'GENERAL';
    }

    const allowed = this.prompts.audiencesFor(dto.type);

    if (!allowed.includes(dto.audience)) {
      throw new BadRequestException('Audience not supported for this type');
    }

    const doc = await this.prisma.document.create({
      data: {
        userId,
        type: dto.type,
        originalText: dto.text ?? '',
        originalPath:
          dto.file && 'path' in dto.file
            ? (dto.file as { path: string }).path
            : '',
        fileMeta: dto.file ? JSON.parse(JSON.stringify(dto.file)) : null,
        audience: dto.audience,
        includeSummary: dto.includeSummary ?? false,
        status: 'PENDING',
      },
    });

    await this.queue.add('simplify', { docId: doc.id });
    return doc;
  }

  list(userId: string) {
    return this.prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  get(id: string, userId: string) {
    return this.prisma.document.findFirst({
      where: { id, userId },
    });
  }
}
