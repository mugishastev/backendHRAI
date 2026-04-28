import { Request, Response } from 'express';
import communicationService from '../services/communication.service';

export const sendMessage = async (req: Request, res: Response) => {
    try {
        const { email, subject, message, name } = req.body;
        
        if (!email || !message) {
            return res.status(400).json({ error: 'Email and message are required' });
        }

        const emailSubject = subject || `Message from HRAI Recruitment regarding your application`;
        const emailBody = `Dear ${name || 'Candidate'},\n\n${message}\n\nBest regards,\nThe HRAI Talent Team`;

        await communicationService.sendEmail(email, emailSubject, emailBody);

        res.json({ message: 'Message sent successfully' });
    } catch (error) {
        console.error('SendMessage Error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
};
