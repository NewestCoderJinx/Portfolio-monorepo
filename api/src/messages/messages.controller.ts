import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RateLimiter } from '../common/rate-limiter';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { Message } from './message.entity';
import { MessagesService } from './messages.service';

/** Each visitor (by IP) may send this many messages per hour. */
export const MESSAGES_PER_HOUR = 5;

@Controller('messages')
export class MessagesController {
  private readonly limiter = new RateLimiter(MESSAGES_PER_HOUR, 60 * 60 * 1000);

  constructor(private readonly messagesService: MessagesService) {}

  /** Public: the contact form posts here. */
  @Post()
  @HttpCode(202)
  async create(@Body() dto: CreateMessageDto, @Req() req: Request): Promise<{ ok: true }> {
    if (!this.limiter.tryHit(req.ip ?? 'unknown')) {
      throw new HttpException('Too many messages. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }
    await this.messagesService.receive(dto);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(): Promise<Message[]> {
    return this.messagesService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMessageDto): Promise<Message> {
    return this.messagesService.setRead(id, dto.read);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.messagesService.remove(id);
  }
}
