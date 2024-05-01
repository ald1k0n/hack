import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [TelegramModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
