import { Injectable, Logger } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';
import { DocumentType } from '@prisma/client';

type PromptConfig = {
  type: DocumentType;
  audiences: Record<string, string>;
  template: string;
};

@Injectable()
export class PromptService {
  private readonly log = new Logger(PromptService.name);
  private configs = new Map<DocumentType, PromptConfig>();

  constructor() {
    const file = readFileSync(join(__dirname, '/config/prompts.yaml'), 'utf8');
    const parsed = yaml.load(file) as PromptConfig[];
    parsed.forEach((cfg) => this.configs.set(cfg.type, cfg));
    this.log.log(`Loaded ${parsed.length} prompt templates`);
  }

  audiencesFor(type: DocumentType): string[] {
    return Object.keys(this.configs.get(type)?.audiences ?? {});
  }

  buildPrompt(type: DocumentType, audience: string, text: string) {
    const cfg = this.configs.get(type);
    if (!cfg) throw new Error('Unknown document type');

    const audPrompt = cfg.audiences[audience] ?? '';
    return cfg.template
      .replace('{{audience}}', audPrompt)
      .replace('{{text}}', text);
  }
}
