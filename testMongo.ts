import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
dotenv.config();

async function testConnection() {
  try {
    const uri = "mongodb://umuravaai:umurava02%21@ac-8vlhxpq-shard-00-00.a5vqlnp.mongodb.net:27017,ac-8vlhxpq-shard-00-01.a5vqlnp.mongodb.net:27017,ac-8vlhxpq-shard-00-02.a5vqlnp.mongodb.net:27017/umurava_ai_hackathon?ssl=true&authSource=admin&retryWrites=true&w=majority&appName=umurava";
    console.log('Testing connection to bypass SRV...');
    await mongoose.connect(uri!);
    console.log('Successfully connected to MongoDB!');
    process.exit(0);
  } catch (err) {
    console.error('Connection failed:', err);
    process.exit(1);
  }
}

testConnection();
