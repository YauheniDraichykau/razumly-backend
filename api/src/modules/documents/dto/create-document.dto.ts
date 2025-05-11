import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentType } from '@prisma/client';

export class FileMetaDto {
  @IsString() originalName: string;
  @IsString() mimeType: string; // e.g. application/pdf
  @IsString() ext: string; // pdf | docx | txt
  @IsOptional() size?: number; // bytes
}

export class CreateDocumentDto {
  @IsEnum(DocumentType)
  type: DocumentType;

  @ValidateIf((o: CreateDocumentDto) => !o.file)
  @IsString()
  @MaxLength(50_000)
  text?: string;

  @ValidateIf((o: CreateDocumentDto) => !o.text)
  @ValidateNested()
  @Type(() => FileMetaDto)
  file?: FileMetaDto;

  @IsOptional() @IsString() audience?: string;
  @IsOptional() @IsBoolean() includeSummary?: boolean;
}
