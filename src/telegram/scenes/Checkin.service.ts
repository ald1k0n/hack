import { Injectable } from '@nestjs/common';
import { Ctx, Wizard, WizardStep, Action } from 'nestjs-telegraf';
import { PrismaService } from 'src/prisma/prisma.service';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';
import { WizardContext } from 'telegraf/typings/scenes';

const buttons: InlineKeyboardButton[][] = [
  [
    { text: 'Ошибочный', callback_data: 'mistaken' },
    { text: 'Заблокировать', callback_data: 'ban' },
  ],
];

@Injectable()
@Wizard('CheckIn')
export class CheckIn {
  constructor(private readonly prisma: PrismaService) {}

  private async updatePostState(id: string, isHarmful: boolean) {
    await this.prisma.post.update({ where: { id }, data: { isHarmful } });
  }

  private async userReply(post: any, ctx: WizardContext) {
    if (post.image_id) {
      await ctx.replyWithPhoto(`http://localhost:3000/image/${post.image_id}`, {
        caption: post.text,
        reply_markup: {
          inline_keyboard: buttons,
        },
      });
    } else if (post.video_id) {
      await ctx.replyWithDocument(
        `http://localhost:3000/video/${post.video_id}`,
        {
          caption: post.text,
          reply_markup: {
            inline_keyboard: buttons,
          },
        },
      );
    } else {
      await ctx.reply(post.text, {
        reply_markup: {
          inline_keyboard: buttons,
        },
      });
    }
  }

  @WizardStep(1)
  async onSceneEnter(@Ctx() ctx: WizardContext): Promise<any> {
    const post = await this.prisma.post.findFirst({
      where: {
        isHarmful: true,
      },
    });

    ctx.wizard.state['currentPost'] = post?.id;

    await this.userReply(post, ctx);
  }

  @Action('mistaken')
  async mistake(@Ctx() ctx: WizardContext) {
    ctx.answerCbQuery();

    const currentPostId = ctx.wizard.state['currentPost'];
    await this.updatePostState(currentPostId, false);

    const post = await this.prisma.post.findFirst({
      where: {
        isHarmful: true,
      },
    });
    if (post) {
      ctx.wizard.state['currentPost'] = post?.id;

      await this.userReply(post, ctx);
    } else {
      await ctx.scene.leave();
    }
  }

  @Action('ban')
  async ban(@Ctx() ctx: WizardContext) {
    const currentPostId = ctx.wizard.state['currentPost'];
    await this.updatePostState(currentPostId, true);

    const post = await this.prisma.post.findFirst({
      where: {
        isHarmful: true,
      },
    });
    if (post) {
      ctx.wizard.state['currentPost'] = post?.id;

      await this.userReply(post, ctx);
    } else {
      await ctx.scene.leave();
    }
  }
}
