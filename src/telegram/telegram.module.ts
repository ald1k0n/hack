import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { TelegramService } from './telegram.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CheckIn } from './scenes/Checkin.service';

import { session } from 'telegraf';

const Session = session();

@Module({
  imports: [
    TelegrafModule.forRoot({
      token: process?.env?.TELEGRAM_API,
      middlewares: [Session],
    }),
  ],
  providers: [TelegramService, PrismaService, CheckIn],
})
export class TelegramModule {}
