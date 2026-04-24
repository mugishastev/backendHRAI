import { AIService } from './src/services/ai.service';
import dotenv from 'dotenv';
dotenv.config();

const dummyJob = {
  title: "Software Engineer",
  description: "Dev job",
  requirements: ["Codiong"],
  skills: ["JS"],
  experienceLevel: "Mid"
};

const dummyApplicants = [{
  _id: "123",
  name: "John Doe",
  skills: ["JS"],
  experience: "5 years",
  education: "BSc",
  structuredProfile: {}
}];

async function testAI() {
  try {
    const result = await AIService.screenCandidates(dummyJob, dummyApplicants);
    console.log("Success:", JSON.stringify(result));
  } catch (err) {
    console.error("AI Script Error:", err);
  }
}

testAI();
