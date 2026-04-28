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
You are an expert technical recruiter and AI assistant for HRAI.
Your task is to analyze a list of job applicants against a specific job description and requirements.

### FAIRNESS DIRECTIVE
You must strictly avoid bias. Do not consider gender, age, ethnicity, location, or any other protected characteristics. 
Focus exclusively on professional skills, experience, and cultural add.

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

### OUTPUT FORMAT
Return a valid JSON object. Do not contain markdown wrapping.
Structure:
{
  "rankings": [
    {
      "applicantId": "string",
      "rank": number,
      "matchScore": number,
      "summary": "string",
      "strengths": ["string"],
      "gaps": ["string"],
      "finalRecommendation": "string"
    }
  ],
  "biasAudit": {
    "fairnessScore": number (0-100),
    "diversityInsights": "Summary of how diversity was considered without using protected traits",
    "flaggedIssues": ["List any potential biases detected in the job description or applicant pool"]
  }
}
`;

      console.log('🤖 Sending prompt to Gemini with Bias Guardrails...');
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();
      console.log('📥 AI Response received.');
      
      const cleanedJSON = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      try {
        const parsed = JSON.parse(cleanedJSON);
        return {
          rankings: Array.isArray(parsed.rankings) ? parsed.rankings : [],
          biasAudit: parsed.biasAudit || { fairnessScore: 100, diversityInsights: 'Standard evaluation applied', flaggedIssues: [] }
        };
      } catch (parseError) {
        console.error('❌ Failed to parse AI JSON:', cleanedJSON);
        return { rankings: [], biasAudit: { fairnessScore: 0, diversityInsights: 'Parsing failed', flaggedIssues: ['Error parsing AI output'] } };
      }
    } catch (error: any) {
      console.error('❌ Error in AI Screening:', error);
      throw new Error(`AI Screening failed: ${error.message}`);
    }
  }
}
