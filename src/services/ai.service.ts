import dotenv from 'dotenv';
dotenv.config();

export class AIService {
  static async screenCandidates(job: any, applicants: any[]) {
    try {
      // Correct import for the official Google SDK
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      
      const apiKey = process.env.GEMINI_API_KEY as string;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not defined in environment variables');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
      const model = genAI.getGenerativeModel({ model: modelName });

      const prompt = `
You are an expert technical recruiter and AI assistant.
Your task is to analyze a list of job applicants against a specific job description and requirements.
Return a valid JSON array of the shortlisted candidates (max 10), ranked from best to worst. 
Do not contain any markdown wrapping like \`\`\`json, just pure JSON output.

Job Title: ${job.title}
Job Description: ${job.description}
Job Requirements: ${Array.isArray(job.requirements) ? job.requirements.join(', ') : job.requirements}
Skills Needed: ${Array.isArray(job.skills) ? job.skills.join(', ') : 'Not specified'}

Applicants:
${applicants.map((app, index) => `
[Applicant ID: ${app._id}]
Name: ${app.name}
Skills: ${Array.isArray(app.skills) ? app.skills.join(', ') : 'Not specified'}
Experience: ${app.experience || 'Not specified'}
Parsed Resume Content: ${(app.resumeText || 'No resume').substring(0, 5000)}
`).join('\n')}

Based on the match between each applicant and the job, provide the structured evaluation.
Each object in the array must strictly follow this JSON structure:
{
  "applicantId": "The ID provided in the applicant profile",
  "rank": number,
  "matchScore": number,
  "summary": "Short summary",
  "strengths": [],
  "gaps": [],
  "finalRecommendation": "Reasoning"
}
`;

      console.log('🤖 Sending prompt to Gemini...');
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();
      console.log('📥 AI Response received.');
      
      // Remove possible markdown JSON wrapper
      const cleanedJSON = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      try {
        const parsed = JSON.parse(cleanedJSON);
        return Array.isArray(parsed) ? parsed : [];
      } catch (parseError) {
        console.error('❌ Failed to parse AI JSON:', cleanedJSON);
        return [];
      }
    } catch (error: any) {
      console.error('❌ Error in AI Screening:', error);
      throw new Error(`AI Screening failed: ${error.message}`);
    }
  }
}
