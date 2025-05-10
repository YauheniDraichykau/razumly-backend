import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly docs: DocumentsService) {}

  /* ---------- UPLOAD (file -> meta) ----------------------------- */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: Express.Multer.File) {
    return this.docs.storeFile(file);
  }

  /* ---------- CREATE (text OR file-meta) ------------------------ */
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(@Body() dto: CreateDocumentDto, @Req() req: Request) {
    return this.docs.create(dto, req.user.userId);
  }

  /* ---------- LIST --------------------------------------------- */
  @Get()
  findAll(@Req() req: Request) {
    return this.docs.list(req.user.userId);
  }

  /* ---------- GET ONE ------------------------------------------ */
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.docs.get(id, req.user.userId);
  }
}
