import axios from 'axios';
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extracts text content from a resume file (PDF or DOCX) provided as a URL.
 * @param resumeUrl The URL of the resume file (e.g., from Cloudinary).
 * @returns A promise that resolves to the extracted text content.
 * @throws An error if the file type is not supported or extraction fails.
 */
export async function extractTextFromResume(resumeUrl: string): Promise<string> {
  try {
    console.log(`[ResumeParser] Fetching resume from: ${resumeUrl}`);
    // Download the file as a buffer
    const response = await axios.get(resumeUrl, { 
      responseType: 'arraybuffer',
      headers: { 'Accept': '*/*' } 
    });
    const buffer = Buffer.from(response.data);

    // Improved type detection
    const contentType = response.headers['content-type'] || '';
    let fileType = String(contentType).toLowerCase();
    
    console.log(`[ResumeParser] Content-Type from headers: ${fileType}`);

    // Fallback detection based on extension or magic numbers
    if (fileType.includes('octet-stream') || !fileType) {
        if (resumeUrl.toLowerCase().endsWith('.pdf') || buffer.slice(0, 4).toString() === '%PDF') {
            fileType = 'application/pdf';
        } else if (resumeUrl.toLowerCase().endsWith('.docx') || buffer.slice(0, 4).toString() === 'PK\x03\x04') {
            fileType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        } else if (resumeUrl.toLowerCase().endsWith('.doc')) {
            fileType = 'application/msword';
        }
    }

    console.log(`[ResumeParser] Detected file type: ${fileType}`);

    let extractedText = '';

    if (fileType.includes('application/pdf')) {
      console.log(`[ResumeParser] Parsing PDF...`);
      const data = await pdfParse(buffer);
      extractedText = data.text;
    } else if (fileType.includes('wordprocessingml') || fileType.includes('msword') || fileType.includes('officedocument')) {
      console.log(`[ResumeParser] Parsing Word document...`);
      const result = await mammoth.extractRawText({ buffer: buffer });
      extractedText = result.value;
    } else {
      // Final attempt: try PDF parse anyway if it looks like one
      if (buffer.slice(0, 4).toString() === '%PDF') {
          console.log(`[ResumeParser] Fallback: Parsing as PDF based on magic numbers...`);
          const data = await pdfParse(buffer);
          extractedText = data.text;
      } else {
          throw new Error(`Unsupported file type: ${fileType}. URL: ${resumeUrl}`);
      }
    }

    if (!extractedText || extractedText.trim().length === 0) {
        console.warn(`[ResumeParser] Warning: Extracted text is empty for ${resumeUrl}`);
    } else {
        console.log(`[ResumeParser] Successfully extracted ${extractedText.length} characters.`);
    }

    return extractedText;
  } catch (error: any) {
    console.error(`[ResumeParser] CRITICAL ERROR for ${resumeUrl}:`, error.message);
    throw new Error(`Failed to extract text from resume: ${error.message}`);
  }
}
