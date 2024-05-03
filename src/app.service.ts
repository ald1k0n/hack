import { Injectable, NotAcceptableException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { forkJoin } from 'rxjs';
import { IPost } from './entity/post.entity';
import { PrismaService } from './prisma/prisma.service';
import { Cron } from '@nestjs/schedule';

const TEXT_CLASSIFIER_MODEL = 'http://localhost:5000/classify';
const IMAGE_CLASSIFIER_MODEL = 'http://localhost:5000/predict';
const RETRAIN_MODEL = 'http://localhost:5000/retrain';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}
  private logger = new Logger();
  private async insertData(payload: Prisma.PostCreateInput) {
    const post = await this.prisma.post.create({
      data: payload,
    });
    return post;
  }

  async createPost(payload: IPost) {
    if (!payload.text)
      throw new NotAcceptableException(
        'Текст должен быть предоставлен для публикации поста',
      );

    return new Promise((resolve, reject) => {
      const requests = {
        text: fetch(TEXT_CLASSIFIER_MODEL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: payload.text }),
        }).then((res) => res.json()),
      };

      // Check if image is provided
      if (payload.image) {
        requests['image'] = fetch(IMAGE_CLASSIFIER_MODEL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: payload.image as string,
          }),
        }).then((res) => res.json());
      }

      forkJoin(requests).subscribe(
        async (data) => {
          let isHarmful = false;

          if (data?.text?.result) isHarmful = true;
          console.log(data);
          //@ts-ignore
          if (payload.image && data?.image?.normal === false) isHarmful = true;

          const { image, ...insertData } = payload;

          if (image) {
            insertData['image_id'] = (payload.image as string).replace(
              'http://localhost:8080/api/image/',
              '',
            );
          }

          //@ts-ignore
          await this.insertData({ ...insertData, isHarmful });

          if (isHarmful) {
            resolve({
              message:
                'Контент является не допустимым для публикации, ваш пост будет проверен администрацией платформы',
            });
          } else {
            resolve(data);
          }
        },
        (error) => reject(error),
      );
    });
  }

  async uploadFile(file: any, type: 'image' | 'video') {
    const uploaded = await this.prisma.file.create({ data: file });
    return `http://localhost:8080/api/${type}/${uploaded.id}`;
  }

  async getFile(id: string) {
    return await this.prisma.file.findFirst({ where: { id } });
  }

  async getAllPosts() {
    return await this.prisma.post.findMany({
      where: {
        isHarmful: false,
      },
    });
  }

  @Cron('0 0 0 ? * * *')
  async retrain() {
    const banList = await this.prisma.ban_Word.findMany();
    const textData = await this.prisma.post.findMany({
      select: {
        text: true,
      },
    });

    const response = await fetch(RETRAIN_MODEL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text_data: textData,
        banned_list: banList,
      }),
    }).then((res) => res.json());

    this.logger.debug('Retrain execution', response);
  }
}
