import { Module } from '@nestjs/common';
import { EmailService } from './email.service';

@Module({
  providers: [EmailService],
  exports: [EmailService], // Exportarlo para usarlo en otros módulos
})
export class EmailModule {}
