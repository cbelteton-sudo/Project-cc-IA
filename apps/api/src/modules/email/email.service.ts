import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      this.logger.warn(
        'RESEND_API_KEY no está configurado. Los correos no se enviarán realmente.',
      );
    }
    this.resend = new Resend(apiKey || 'dummy_key');
  }

  async sendEmail(to: string, subject: string, html: string) {
    if (!process.env.RESEND_API_KEY) {
      this.logger.log(
        `Log de correo simulado para: ${to}. Subject: ${subject}`,
      );
      // Return a fake success response if no API key is present
      return { id: 'simulated_email_id' };
    }

    try {
      const data = await this.resend.emails.send({
        from: 'FieldClose <onboarding@resend.dev>',
        to,
        subject,
        html,
      });
      return data;
    } catch (error) {
      this.logger.error('Error al enviar el correo:', error);
      throw error;
    }
  }
}
