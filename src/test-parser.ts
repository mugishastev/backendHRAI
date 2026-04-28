import { extractTextFromResume } from './routes/resumeParser';

async function test() {
    const testPdf = 'https://res.cloudinary.com/diszeadzi/raw/upload/v1777398609/hrai_resumes/ayfizttq30ifbirpcx7k';
    console.log('Testing User Cloudinary URL extraction...');
    try {
        const text = await extractTextFromResume(testPdf);
        console.log('--- EXTRACTED TEXT ---');
        console.log(text);
        console.log('----------------------');
        if (text && text.includes('Dummy PDF file')) {
            console.log('✅ PDF Extraction SUCCESSFUL!');
        } else {
            console.error('❌ PDF Extraction failed to find expected text.');
        }
    } catch (e: any) {
        console.error('❌ PDF Extraction ERROR:', e.message);
    }
}

test();
