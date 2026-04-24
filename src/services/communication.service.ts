import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

class CommunicationService {
    private mailTransporter;

    constructor() {
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            this.mailTransporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: Number(process.env.SMTP_PORT) || 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
        }
    }

    async sendEmail(to: string, subject: string, text: string) {
        if (!this.mailTransporter) {
            console.warn('SMTP is not configured. Skipping Email.');
            return;
        }

        try {
            await this.mailTransporter.sendMail({
                from: `"HRAI Recruitment" <${process.env.SMTP_USER}>`,
                to,
                subject,
                text,
            });
            console.log(`Email Sent to ${to}`);
        } catch (error) {
            console.error('Failed to send Email:', error);
        }
    }
}

export default new CommunicationService();
