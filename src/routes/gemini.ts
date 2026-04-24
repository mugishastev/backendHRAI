import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Configures the response schema for structured AI output.
 * This ensures the frontend receives consistent data.
 */
const responseSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        matchScore: { type: SchemaType.NUMBER, description: "A score from 0-100" },
        rank: { type: SchemaType.NUMBER, description: "Suggested rank among candidates" },
        strengths: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        gaps: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        reasoning: { type: SchemaType.STRING, description: "Clear explanation of the score" },
        recommendation: { type: SchemaType.STRING, description: "Hiring recommendation (e.g., Shortlist, Reject, Interview)" }
    },
    required: ["matchScore", "strengths", "gaps", "reasoning", "recommendation"]
};

/**
 * Screens an applicant against a job description using Gemini 1.5 Flash.
 */
export async function screenCandidate(jobDescription: string, candidateData: string) {
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        },
    });

    const prompt = `
    Act as a professional HR Recruiter. Evaluate the following candidate against the job requirements.
    
    JOB DESCRIPTION:
    ${jobDescription}
    
    CANDIDATE DATA / RESUME:
    ${candidateData}
    
    Perform a deep analysis of skills, experience, and educational background.
    Be objective and highlight missing requirements (gaps) as well as standout qualifications (strengths).
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        return JSON.parse(response.text());
    } catch (error) {
        console.error("Gemini Screening Error:", error);
        throw new Error("AI Screening failed to generate a result.");
    }
}

/**
 * Batch screening for multiple candidates (Top 10/20 Shortlisting)
 */
export async function generateShortlist(jobDescription: string, candidates: any[]) {
    // Implementation for multi-candidate evaluation in a single prompt 
    // as recommended by the hackathon guide.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
        Analyze these ${candidates.length} candidates for the role: ${jobDescription}.
        Provide a ranked Top 10 list with the candidate ID and a brief justification for each.
        CANDIDATES:
        ${JSON.stringify(candidates.map(c => ({ id: c._id, text: c.resumeText })))}
        
        Format: JSON list of objects with candidateId, rank, and justification.
    `;

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
}