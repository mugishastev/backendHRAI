# HRAI - AI-Powered Talent Platform (Backend Engine) ⚙️🛡️

This is the high-performance Node.js/Express backend powering the **HRAI** platform. It manages the core recruitment logic, user security, and intelligent candidate screening using Google Gemini AI.

---

## 🚀 Technical Core

*   **AI Integration**: Powered by **Google Gemini 1.5 Flash** for high-accuracy candidate evaluation and ranking.
*   **Resume Extraction**: Sophisticated parsing engine using `pdf-parse` and `mammoth` for multi-format text extraction (PDF, DOCX).
*   **Database**: **MongoDB Atlas** (Mongoose) for scalable, flexible data management and real-time candidate tracking.
*   **Security**: Professional-grade JWT Authentication, `bcrypt` hashing, and API rate-limiting for system stability.
*   **Storage**: **Cloudinary** integration for secure, high-availability resume file hosting.

---

## 🤖 AI Screening Workflow

The backend implements a sophisticated screening pipeline:
1.  **Ingestion**: Resumes are parsed into clean text data.
2.  **Contextualization**: The engine combines the Job Description, Skills, and the Recruiter's **AI Blueprint**.
3.  **Inference**: Gemini analyzes the candidate's strengths and gaps relative to the job requirements.
4.  **Ranking**: The engine generates a relative rank across the entire applicant pool, ensuring the best talent rises to the top.

---

## 📦 API Architecture

### 🔐 Authentication (`/api/auth`)
*   `POST /register`: Unified registration for Applicants and Recruiters.
*   `POST /login`: Secure access with role-based JWT issuance.

### 💼 Recruitment Operations (`/api/jobs`, `/api/applicants`, `/api/screening`)
*   `GET /jobs`: Public and private job listings.
*   `POST /screening/run`: Triggers the AI analysis for an entire job role.
*   `GET /stats`: Aggregated dashboard metrics (Application trends, Success rates).

### 👥 Governance (`/api/users`) - *Admin Only*
*   `GET /`: User directory and account management.
*   `POST /`: Admin creation of trusted Recruiter accounts.

---

## 🛠️ Getting Started

1. **Install Dependencies**: `npm install`
2. **Environment Configuration**: Create a `.env` file with:
   - `MONGODB_URI`: Your MongoDB Atlas connection string.
   - `GEMINI_API_KEY`: Your Google AI Studio API Key.
   - `JWT_SECRET`: A long, random string for token signing.
   - `CLOUDINARY_` keys for resume management.
3. **Launch**: `npm run dev` for development or `npm start` for production.

---

## 👥 Development Team: Sohoza System
*   **Team Members**: Steven, Musa, Aliance, Mugisha, Nadia
*   **Project**: HRAI Platform (Umurava AI Hackathon)

---
*Backend engineered for speed, accuracy, and scalability.*
