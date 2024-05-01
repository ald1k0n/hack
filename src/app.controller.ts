import {
  Body,
  Controller,
  Post,
  UploadedFile,
  Get,
  UseInterceptors,
  Param,
  Res,
} from '@nestjs/common';
import { AppService } from './app.service';
import { IPost } from './entity/post.entity';
import { FileInterceptor } from '@nestjs/platform-express';

import { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/image/:id')
  async getImage(@Param('id') id: string, @Res() res: Response) {
    const file = await this.appService.getFile(id);

    res.set({
      'Content-Type': file.mimeType,
      'Content-Length': file.size,
    });
    res.send(file.file);
  }

  @Post('/create')
  async createPost(@Body() body: IPost) {
    return await this.appService.createPost(body);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const files: any = {
      file: Buffer.from(file.buffer),
      size: file.size,
      mimeType: file.mimetype,
    };

    const isImage = file.mimetype.includes('image');

    return await this.appService.uploadFile(files, isImage ? 'image' : 'video');
    // return Buffer.from(file.buffer);
  }
}
