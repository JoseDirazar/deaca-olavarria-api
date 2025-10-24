import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './infrastructure/decorators/public-route.decorator';
import { NoLogging } from './infrastructure/decorators/no-logging.decorator';
import { SendMessageDto } from './infrastructure/dto/send-message.dto';

@Controller()
@Public()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  @NoLogging()
  get(): Record<string, string> {
    return this.appService.getState();
  }

  @Post('contact')
  async sendEmail(@Body() sendMessageDto: SendMessageDto) {
    await this.appService.sendEmail(sendMessageDto);
    return {
      message: 'Email enviado.',
    };
  }
}
