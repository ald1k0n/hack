import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { forkJoin } from 'rxjs';
import { IPost } from './entity/post.entity';
import { PrismaService } from './prisma/prisma.service';

const TEXT_CLASSIFIER_MODEL = 'http://localhost:5000/classify';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  private async insertData(payload: Prisma.PostCreateInput) {
    const post = await this.prisma.post.create({
      data: payload,
    });
    return post;
  }

  async createPost(payload: IPost) {
    return new Promise((resolve, reject) => {
      forkJoin({
        text: fetch(TEXT_CLASSIFIER_MODEL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: payload.text }),
        }).then((res) => res.json()),
      }).subscribe(
        async (data) => {
          if (data?.text?.result) {
            //@ts-ignore
            await this.insertData({ ...payload, isHarmful: true });
            resolve({
              message:
                'Контент является не допустимым для публикации, ваш пост будет проверен администрацией платформы',
            });
          } else {
            //@ts-ignore
            await this.insertData({ ...payload, isHarmful: false });
            resolve(data);
          }
        },
        (error) => reject(error),
      );
    });
  }

  async uploadFile(file: any, type: 'image' | 'video') {
    const uploaded = await this.prisma.file.create({ data: file });
    return `http://localhost:3000/api/${type}/${uploaded.id}`;
  }

  async getFile(id: string) {
    return await this.prisma.file.findFirst({ where: { id } });
  }
}
