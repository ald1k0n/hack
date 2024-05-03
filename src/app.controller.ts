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
import * as sharp from 'sharp';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('/create')
  async createPost(@Body() body: IPost) {
    return await this.appService.createPost(body);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    let convertedBuffer = file.buffer;
    let convertedMimeType = file.mimetype;

    // Check if file is an image and not in JPG format
    if (file.mimetype.includes('image') && !file.mimetype.includes('jpeg')) {
      // Convert to JPG format using sharp
      convertedBuffer = await sharp(file.buffer).jpeg().toBuffer();
      convertedMimeType = 'image/jpeg';
    }

    const files: any = {
      file: Buffer.from(convertedBuffer),
      size: file.size,
      mimeType: convertedMimeType,
    };
    const isImage = convertedMimeType.includes('image');

    return await this.appService.uploadFile(files, isImage ? 'image' : 'video');
  }

  @Get('/')
  async getAll() {
    return await this.appService.getAllPosts();
  }

  @Get('/image/:id')
  async getImage(@Param('id') id: string, @Res() res: Response) {
    const file = await this.appService.getFile(id);
    res.set({
      'Content-Type': file.mimeType,
      'Content-Length': file.size,
    });
    res.send(file.file);
  }

  @Get('/video/:id')
  async getVideo(@Param('id') id: string, @Res() res: Response) {
    const file = await this.appService.getFile(id);
    res.set({
      'Content-Type': file.mimeType,
      'Content-Length': file.size,
    });
    res.send(file.file);
  }
}
