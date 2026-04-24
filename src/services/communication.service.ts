import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

class CommunicationService {
    private mailTransporter: any;

    constructor() {
        const user = process.env.SMTP_USER || process.env.NODEMAILER_USER;
        const pass = process.env.SMTP_PASS || process.env.NODEMAILER_PASS;
        const host = process.env.SMTP_HOST || 'smtp.gmail.com';
        const port = Number(process.env.SMTP_PORT) || 587;

        if (user && pass) {
            this.mailTransporter = nodemailer.createTransport({
                host,
                port,
                secure: port === 465, 
                auth: { user, pass },
            });
            console.log('✅ Email Service Initialized');
        } else {
            console.warn('⚠️ SMTP credentials missing. Email service is inactive.');
        }
    }

    async sendEmail(to: string, subject: string, text: string, html?: string) {
        if (!this.mailTransporter) {
            console.warn('❌ Cannot send email: SMTP not configured.');
            return;
        }

        const user = process.env.SMTP_USER || process.env.NODEMAILER_USER;

        try {
            await this.mailTransporter.sendMail({
                from: `"HRAI Recruitment" <${user}>`,
                to,
                subject,
                text,
                html: html || this.wrapInTemplate(subject, text),
            });
            console.log(`📧 Email sent successfully to: ${to}`);
        } catch (error) {
            console.error(`❌ Failed to send email to ${to}:`, error);
        }
    }

    private wrapInTemplate(title: string, content: string) {
        return `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 24px; color: #1e293b;">
            <div style="margin-bottom: 30px; text-align: center;">
                <h1 style="color: #4f46e5; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.025em;">HRAI PLATFORM</h1>
            </div>
            <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 20px;">${title}</h2>
            <div style="line-height: 1.6; color: #475569; font-size: 16px;">
                ${content.replace(/\n/g, '<br>')}
            </div>
            <div style="margin-top: 40px; padding-top: 20px; border-t: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: center;">
                <p>This is an automated message from the HRAI Talent System.</p>
                <p>&copy; 2026 Umurava AI. All rights reserved.</p>
            </div>
        </div>
        `;
    }
}

export default new CommunicationService();
