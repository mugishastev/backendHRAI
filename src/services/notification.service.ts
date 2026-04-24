import Notification, { INotification } from '../models/Notification';

class NotificationService {
  async create(data: Partial<INotification>) {
    try {
      const notification = new Notification(data);
      await notification.save();
      return notification;
    } catch (error) {
      console.error('Failed to create notification:', error);
    }
  }

  async notifyApplicantReceived(applicantName: string, jobTitle: string) {
    return this.create({
      title: 'New Applicant',
      desc: `${applicantName} has just applied for the ${jobTitle} position.`,
      type: 'info'
    });
  }

  async notifyScreeningComplete(jobTitle: string, candidateCount: number) {
    return this.create({
      title: 'AI Screening Complete',
      desc: `Screening for "${jobTitle}" has finished. ${candidateCount} candidates have been ranked.`,
      type: 'success'
    });
  }

  async notifyScreeningFailed(jobTitle: string, reason?: string) {
    return this.create({
      title: 'Screening Failed',
      desc: `The AI screening for "${jobTitle}" failed. ${reason || 'Check system logs for details.'}`,
      type: 'error'
    });
  }

  async notifyUserCreated(email: string, role: string) {
    return this.create({
      title: 'New Account Created',
      desc: `A new ${role} account has been created for ${email}.`,
      type: 'success',
      targetRole: 'admin'
    });
  }

  async notifyStatusUpdate(userId: string, jobTitle: string, status: string) {
    return this.create({
      title: 'Application Update',
      desc: `Your application status for "${jobTitle}" has changed to ${status.toUpperCase()}.`,
      type: 'info',
      targetRole: 'applicant',
      targetUserId: userId
    });
  }
}

export default new NotificationService();
