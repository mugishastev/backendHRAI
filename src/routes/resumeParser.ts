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
    // Download the file as a buffer
    const response = await axios.get(resumeUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);

    // Improved type detection
    const contentType = response.headers['content-type'];
    let fileType = '';

    if (contentType) {
      fileType = contentType;
    } else if (resumeUrl.toLowerCase().endsWith('.pdf')) {
      fileType = 'application/pdf';
    } else if (resumeUrl.toLowerCase().endsWith('.docx')) {
      fileType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (resumeUrl.toLowerCase().endsWith('.doc')) {
      fileType = 'application/msword';
    }

    // Fallback: Check magic numbers if extension fails
    if (!fileType && buffer.slice(0, 4).toString() === '%PDF') {
      fileType = 'application/pdf';
    }

    if (fileType.includes('application/pdf')) {
      const data = await pdfParse(buffer);
      return data.text;
    } else if (fileType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') || fileType.includes('application/msword')) {
      // Mammoth primarily supports .docx, but can sometimes handle .doc
      const result = await mammoth.extractRawText({ buffer: buffer });
      return result.value; // The raw text
    } else {
      throw new Error(`Unsupported file type: ${fileType}. Only PDF, DOCX, and DOC are supported.`);
    }
  } catch (error: any) {
    console.error(`Error extracting text from resume URL ${resumeUrl}:`, error.message, error.stack);
    throw new Error(`Failed to extract text from resume: ${error.message}`);
  }
}
