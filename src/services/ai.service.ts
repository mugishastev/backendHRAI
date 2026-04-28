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
      "finalRecommendation": "string",
      "skillsVerification": {
        "verified": ["Skills found in both profile and resume"],
        "claimedButMissing": ["Skills claimed in profile but NOT found in resume text"],
        "hiddenGems": ["Valuable skills found in resume but NOT mentioned in profile"]
      }
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

  static async analyzeResumeStructure(resumeText: string) {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const apiKey = process.env.GEMINI_API_KEY as string;
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });

      const prompt = `
You are an AI Resume Parser. Your goal is to extract structured data from the following resume text.
If a section is missing, return null for that field.

Resume Text:
${resumeText.substring(0, 8000)}

### EXTRACT THE FOLLOWING SECTIONS INTO JSON:
1. Contact Information (name, email, phone, location, linkedin)
2. Professional Summary (3-4 sentences)
3. Work Experience (List of objects: title, company, dates, achievements[])
4. Skills (Technical vs Soft)
5. Education (List of objects: degree, school, year)
6. Optional (Certifications, Projects, Languages, Awards)

### QUALITY SCORE
Provide a "completenessScore" (0-100) based on how many essential sections (Contact, Summary, Experience, Skills, Education) are present.

Return ONLY pure JSON:
{
  "contact": { "name": "", "email": "", "phone": "", "location": "", "linkedin": "" },
  "summary": "",
  "experience": [{ "title": "", "company": "", "dates": "", "achievements": [] }],
  "skills": { "technical": [], "soft": [] },
  "education": [{ "degree": "", "school": "", "year": "" }],
  "optional": { "certifications": [], "projects": [], "languages": [], "awards": [] },
  "completenessScore": number
}
`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(responseText);
    } catch (error) {
      console.error('❌ Error analyzing resume structure:', error);
      return null;
    }
  }
}
