import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendEmail(to: string, subject: string, html: string) {
    try {
      const response = await this.resend.emails.send({
        from: 'no-reply@forgebyteslab.com', // Debe coincidir con tu dominio verificado
        to,
        subject,
        html,
      });

      return response;
    } catch (error) {
      console.error('Error enviando email:', error);
      throw new Error('No se pudo enviar el correo');
    }
  }
}
