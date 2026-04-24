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
Job Requirements: ${job.requirements.join(', ')}
Skills Needed: ${job.skills.join(', ')}
Experience Level Needed: ${job.experienceLevel}

${job.aiBlueprint ? `SPECIAL RECRUITER BLUEPRINT (FOLLOW STRICTLY): ${job.aiBlueprint}` : ''}

Applicants:
${applicants.map((app, index) => `
[Applicant ID: ${app._id}]
Name: ${app.name}
Skills: ${app.skills?.join(', ')}
Experience: ${app.experience}
Availability: ${app.availability || 'Not specified'}
Portfolio: ${app.portfolioUrl || 'None'}
Parsed Resume Content: ${app.resumeText || 'No resume text provided'}
Structured Profile Input: ${JSON.stringify(app.structuredProfile || {})}
`).join('\n')}

Based on the match between each applicant and the job, provide the structured evaluation.
Each object in the array must strictly follow this JSON structure:
{
  "applicantId": "The ID provided in the applicant profile",
  "rank": number (1 is best),
  "matchScore": number (0 to 100),
  "summary": "One-sentence executive recruiter summary",
  "strengths": ["list", "of", "strengths"],
  "gaps": ["list", "of", "gaps or risks"],
  "finalRecommendation": "A short paragraph explaining the reasoning"
}
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();
      
      // Remove possible markdown JSON wrapper
      const cleanedJSON = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      return JSON.parse(cleanedJSON);
    } catch (error: any) {
      console.error('Error in AI Screening:', error);
      throw new Error(`AI Screening failed: ${error.message}`);
    }
  }
}
