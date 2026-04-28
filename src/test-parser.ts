import { extractTextFromResume } from './routes/resumeParser';

async function test() {
    const testPdf = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    console.log('Testing PDF extraction...');
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
