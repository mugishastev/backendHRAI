import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Notification from './src/models/Notification';

dotenv.config();

const seedNotifications = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    
    await Notification.deleteMany({});
    
    await Notification.create([
      { title: 'AI Screening Complete', desc: 'Batch screening for "Senior Developer" role has finished. 12 candidates ranked.', type: 'success' },
      { title: 'New Job Application', desc: 'Alice Johnson just applied for the "UI/UX Designer" position.', type: 'info' },
      { title: 'Low Candidate Volume', desc: 'The "Backend Architect" role has fewer than 5 applicants. Consider promoting it.', type: 'warning' },
      { title: 'System Maintenance', desc: 'Umurava AI Platform will be offline for 15 mins at midnight.', type: 'error' },
    ]);

    console.log('✅ Seeding Notifications successful!');
    process.exit();
  } catch (error) {
    console.error('❌ Error seeding notifications:', error);
    process.exit(1);
  }
};

seedNotifications();
