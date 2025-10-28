import { EmailService } from '@modules/email/email.service';
import { version } from '../package.json';
import { Injectable } from '@nestjs/common';
import { SendMessageDto } from './infrastructure/dto/send-message.dto';

@Injectable()
export class AppService {
  constructor(private readonly emailService: EmailService) {}

  getState(): Record<string, string> {
    return {
      version,
    };
  }

  async sendEmail(sendMessageDto: SendMessageDto) {
    await this.emailService.sendEmail(
      'jfdirazar@gmail.com',
      'Nuevo mensaje desde la web',
      `
      <p>${sendMessageDto.message}</p>
      <p>${sendMessageDto.name}</p>
      <p>${sendMessageDto.email}</p>`,
    );
    return {
      message: 'Email sent',
    };
  }
}
