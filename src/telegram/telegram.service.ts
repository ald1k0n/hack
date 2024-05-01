import {
  Update,
  Ctx,
  Start,
  Help,
  On,
  Hears,
  Scene,
  SceneEnter,
  Action,
  Next,
} from 'nestjs-telegraf';
import { PrismaService } from 'src/prisma/prisma.service';

import { Context } from 'telegraf';
import { SceneContext } from 'telegraf/typings/scenes';

const mainSceneButtons = [[{ text: 'Проверка постов', callback_data: 'join' }]];

@Update()
export class TelegramService {
  constructor(private readonly prisma: PrismaService) {}

  private async addIfNotExist(id: number) {
    const candidate = await this.prisma.admins.findFirst({
      where: { telegramId: String(id) },
    });
    if (!candidate) {
      await this.prisma.admins.create({
        data: {
          telegramId: String(id),
        },
      });
    }
  }

  @Start()
  async start(@Ctx() ctx: Context) {
    await this.addIfNotExist(ctx.from.id);
    await ctx.reply(
      `Добро пожаловать ${ctx.from.username}, вы являетесь администратором нашей псевдо платформы)`,
      {
        reply_markup: { inline_keyboard: mainSceneButtons },
      },
    );
  }

  @On('sticker')
  async on(@Ctx() ctx: Context) {
    await ctx.reply('👍');
  }

  @Action('join')
  async action(@Ctx() ctx: SceneContext) {
    await ctx.scene.enter('CheckIn').then(() => ctx.answerCbQuery());
  }
}
