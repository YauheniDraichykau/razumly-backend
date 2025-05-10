import { Processor, Process, OnQueueFailed, OnQueueError } from '@nestjs/bull';
import { Job } from 'bull';
import { PromptService } from '../prompt/prompt.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { parsePdf } from 'src/utils/parse-pdf';
import { callOpenAi } from 'src/utils/call-openai';

@Processor('simplify')
export class SimplifyProcessor {
  constructor(
    private prisma: PrismaService,
    private prompts: PromptService,
  ) {
    console.debug('SIMPLIFIER CONSTRUCTOR');
  }

  @Process('simplify')
  async handle(job: Job<{ docId: string }>) {
    console.debug('HANDLE IN SIMPLIFIER');

    const doc = await this.prisma.document.findUnique({
      where: { id: job.data.docId },
    });
    if (!doc) return;

    const text =
      doc.originalText ||
      (doc.originalPath?.endsWith('.pdf')
        ? await parsePdf(doc.originalPath)
        : '');

    const prompt = this.prompts.buildPrompt(
      doc.type,
      doc.audience ?? 'GENERAL',
      text,
    );

    try {
      const simplified = await callOpenAi(prompt);
      await this.prisma.document.update({
        where: { id: doc.id },
        data: { simplified, status: 'COMPLETED', completedAt: new Date() },
      });
    } catch (err) {
      await this.prisma.document.update({
        where: { id: doc.id },
        data: { status: 'FAILED', error: String(err) },
      });
    }
  }

  @OnQueueFailed()
  onFailed(job: Job, err: Error) {
    console.error('❌ Queue job failed:', job.id, err);
  }

  @OnQueueError()
  onQueueError(err: Error) {
    console.error('❌ Queue error:', err);
  }
}
