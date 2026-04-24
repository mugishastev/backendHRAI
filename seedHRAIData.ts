import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import Job from './src/models/Job';
import Applicant from './src/models/Applicant';

dns.setDefaultResultOrder('ipv4first');
dotenv.config();

const jobs = [
    {
        title: "Senior Full Stack Developer",
        department: "Engineering",
        description: "We are looking for a Senior Full Stack Developer proficient in React, Node.js, and TypeScript to build scalable web applications.",
        requirements: ["5+ years experience", "Strong TS/JS skills", "Cloud experience (AWS/Azure)"],
        skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS"],
        experienceLevel: "Senior",
        aiBlueprint: "Look for strong architectural skills and experience with microservices."
    },
    {
        title: "AI/ML Engineer",
        department: "Artificial Intelligence",
        description: "Develop and deploy machine learning models using Python and TensorFlow. Experience with Large Language Models is a plus.",
        requirements: ["MSc or PhD in CS/Math", "Python proficiency", "Deep Learning experience"],
        skills: ["Python", "TensorFlow", "PyTorch", "OpenAI API", "NLP"],
        experienceLevel: "Mid-Senior",
        aiBlueprint: "Prioritize candidates with actual production experience in LLMs or computer vision."
    },
    {
        title: "Product Designer (UI/UX)",
        department: "Design",
        description: "Create beautiful and functional user interfaces for our AI-powered products. Expertise in Figma is required.",
        requirements: ["Portfolio of work", "User research skills", "Prototyping experience"],
        skills: ["Figma", "Adobe XD", "User Research", "Interaction Design", "Prototyping"],
        experienceLevel: "Mid",
        aiBlueprint: "Focus on visual aesthetics and user-centric design principles."
    },
    {
        title: "Product Manager",
        department: "Product",
        description: "Define the product roadmap and work closely with engineering and design to deliver high-quality features.",
        requirements: ["3+ years in PM role", "Technical background preferred", "Agile experience"],
        skills: ["Roadmapping", "Agile", "Jira", "Market Analysis", "Stakeholder Management"],
        experienceLevel: "Mid",
        aiBlueprint: "Search for data-driven decision makers with strong communication skills."
    },
    {
        title: "Data Analyst",
        department: "Data Science",
        description: "Interpret data, analyze results using statistical techniques and provide ongoing reports.",
        requirements: ["SQL mastery", "Excel proficiency", "Data visualization skills"],
        skills: ["SQL", "Tableau", "Python", "Excel", "Statistics"],
        experienceLevel: "Junior-Mid",
        aiBlueprint: "Verify SQL skills and ability to translate complex data into actionable insights."
    },
    {
        title: "DevOps Engineer",
        department: "Infrastructure",
        description: "Automate and streamline our operations and processes. Build and maintain tools for deployment, monitoring and operations.",
        requirements: ["Docker & Kubernetes", "CI/CD pipelines", "Infrastructure as Code"],
        skills: ["Docker", "Kubernetes", "Terraform", "Jenkins", "Linux"],
        experienceLevel: "Mid-Senior",
        aiBlueprint: "Look for strong automation mindset and experience with high-availability systems."
    },
    {
        title: "Marketing Manager",
        department: "Marketing",
        description: "Lead our marketing campaigns and brand strategy. Expertise in digital marketing and SEO is a must.",
        requirements: ["Proven track record in growth", "SEO/SEM knowledge", "Content strategy"],
        skills: ["SEO", "Content Marketing", "Google Analytics", "Social Media", "Email Marketing"],
        experienceLevel: "Senior",
        aiBlueprint: "Prioritize candidates with experience in B2B SaaS marketing."
    },
    {
        title: "Mobile App Developer (React Native)",
        department: "Engineering",
        description: "Build cross-platform mobile applications for iOS and Android using React Native.",
        requirements: ["React Native experience", "Mobile UI patterns", "App store deployment"],
        skills: ["React Native", "JavaScript", "Redux", "Firebase", "iOS/Android"],
        experienceLevel: "Mid",
        aiBlueprint: "Focus on app performance optimization and smooth UI interactions."
    },
    {
        title: "Frontend Developer",
        department: "Engineering",
        description: "Translate designs into high-quality code. Focus on performance and accessibility.",
        requirements: ["Expert in HTML/CSS", "React proficiency", "Modern JS knowledge"],
        skills: ["React", "Tailwind CSS", "Next.js", "Accessibility", "Web Performance"],
        experienceLevel: "Junior-Mid",
        aiBlueprint: "Check for clean code practices and attention to UI details."
    },
    {
        title: "Backend Engineer (Go/Rust)",
        department: "Engineering",
        description: "Build high-performance backend services using Go or Rust.",
        requirements: ["Strong systems programming knowledge", "Concurrency expertise", "API design"],
        skills: ["Go", "Rust", "gRPC", "Redis", "Distributed Systems"],
        experienceLevel: "Senior",
        aiBlueprint: "Prioritize system performance and scalability expertise."
    }
];

const names = ["James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen"];
const surnames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"];

const skillPool: Record<string, string[]> = {
    "Engineering": ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS", "Go", "Rust", "Docker", "Kubernetes", "Next.js", "Tailwind CSS"],
    "Artificial Intelligence": ["Python", "TensorFlow", "PyTorch", "NLP", "Computer Vision", "Scikit-Learn"],
    "Design": ["Figma", "Sketch", "Adobe XD", "User Research", "Interaction Design"],
    "Product": ["Agile", "Scrum", "Jira", "Product Strategy", "User Stories"],
    "Data Science": ["SQL", "Python", "R", "Tableau", "PowerBI", "Statistics"],
    "Infrastructure": ["AWS", "Azure", "Terraform", "Ansible", "CI/CD", "Linux"],
    "Marketing": ["SEO", "PPC", "Content Strategy", "Brand Management", "Copywriting"]
};

async function seed() {
    try {
        console.log('Connecting to MongoDB...');
        const uri = process.env.MONGODB_URI as string;
        
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
        });
        console.log('Connected.');

        // Clear existing test data
        await Job.deleteMany({});
        await Applicant.deleteMany({});

        console.log('Seeding 10 Jobs...');
        const createdJobs = await Job.insertMany(jobs);
        console.log(`Created ${createdJobs.length} jobs.`);

        const allApplicants = [];
        console.log('Generating 100 Applicants...');

        for (let i = 0; i < 100; i++) {
            const jobIndex = i % createdJobs.length;
            const job = createdJobs[jobIndex];
            if (!job) continue;

            const firstName = names[Math.floor(Math.random() * names.length)];
            const lastName = surnames[Math.floor(Math.random() * surnames.length)];
            const name = `${firstName} ${lastName}`;
            const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${i}@example.com`;
            
            // Randomly select 3-6 skills from the relevant department pool
            const dept = job.department || "Engineering";
            const pool = skillPool[dept] || skillPool["Engineering"];
            const skills = [...pool].sort(() => 0.5 - Math.random()).slice(0, 3 + Math.floor(Math.random() * 4));
            
            const expYears = 1 + Math.floor(Math.random() * 10);
            
            // Distribute application dates over the last 7 days
            const daysAgo = Math.floor(Math.random() * 7);
            const createdAt = new Date();
            createdAt.setDate(createdAt.getDate() - daysAgo);

            allApplicants.push({
                jobId: job._id,
                name,
                email,
                phone: `+25078${Math.floor(1000000 + Math.random() * 9000000)}`,
                skills,
                experience: `${expYears} years in ${dept}`,
                currentJobTitle: `${job.title.split(' ')[0]} Specialist`,
                availability: "Immediate",
                status: "applied",
                resumeUrl: "https://example.com/resume.pdf", // Placeholder
                coverLetter: `I am highly interested in the ${job.title} position...`,
                createdAt
            });
        }

        const createdApplicants = await Applicant.insertMany(allApplicants);
        console.log(`Successfully seeded ${createdApplicants.length} applicants across 10 jobs.`);

        console.log('Seeding complete! Log in to the dashboard to test the AI.');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();
