# 📚 Adaptive Multi-Modal AI Learning System: Project Overview

An intelligent educational platform designed to transform complex learning materials into accessible, engaging, and multi-dimensional content.

---

## 🌟 Key Features

### 1. **Selective Intelligence Workflow**
Instead of static generation, the app uses a **step-based selection flow**. You input your text, and the AI asks you which path to take:
- **Simplified**: Optimized for introductory learners (4th-grade level).
- **Advanced**: Scholarly, rigorous terminology for deep study.
- **Accessibility**: Structured with semantic tags for screen readers and high readability.
- **Emoji Version**: A fun, visual translation of the lesson using descriptive icons.

### 2. **Universal Document Extraction**
Upload any existing material. The platform handles:
- **PDFs**: Intensive server-side extraction for multi-page documents.
- **Word (.docx)**: Clean parsing of Microsoft Word files.
- **Text (.txt)**: Instant upload of plain text files.

### 3. **Interactive AI Quizzes**
Instantly turn any lesson into an active learning experience. Generate 3-question Multiple Choice Quizzes (MCQs) with real-time feedback and scoring.

### 4. **Multi-Language Inclusion**
Full support for major **Indian Languages** (Telugu, Tamil, Kannada, Marathi, Hindi, etc.) and global languages (Spanish, French, Japanese).

### 5. **Multimedia Enrichment**
- **AI Illustrations**: Generates hyperrealistic educational diagrams using Stable Diffusion.
- **Smart Video Search**: Automatically finds the most relevant educational YouTube video for the topic.
- **Voice Narration**: High-quality text-to-speech built directly into the browser.

---

## 🧠 AI Models Used

The platform utilizes a multi-model fallback strategy via **OpenRouter** to ensure 100% uptime:

| Feature | Primary Model | Why? |
| :--- | :--- | :--- |
| **Logic & Rewriting** | `google/gemini-2.0-flash-001` | Fastest reasoning with high context windows. |
| **Translation** | `google/gemini-flash-1.5` | Exceptional multilingual performance. |
| **Image Generation** | `Stable Diffusion 2.1` | High-fidelity scientific and concept art. |
| **Video Search AI** | `google/gemini-2.0-flash-001` | Best at extracting relevant search intent from long text. |

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | **React 19** | Modern, component-based user interface. |
| **Styling** | **Vanilla CSS + Glassmorphism** | Premium, high-end "Aero" aesthetic. |
| **Build Tool** | **Vite** | Lightning-fast development and optimized bundling. |
| **Backend (Local)** | **Node.js (Vite Middleware)** | Secure proxying and resource-heavy processing (PDF parsing). |
| **PDF Processing** | `pdf-parse` | Robust Node-level text extraction. |
| **Word Processing** | `mammoth.js` | Industry-standard DOCX converter. |
| **Icons** | `Lucide React` | Sharp, consistent vector iconography. |
| **Export** | `jsPDF` | High-performance PDF lesson pack generation. |

---

## 🚀 How It Works (Internal Logic)

1. **Input**: User pastes text or uploads a file (.pdf/.docx).
2. **Server-Side Proxy**: Vite bypasses CORS restrictions to securely fetch from OpenRouter and Hugging Face.
3. **Selective Prompting**: Specialized system prompts ensure the AI returns **Structured JSON**, preventing common parsing errors.
4. **Interactive Dashboard**: Modern tabs and selective generation minimize API costs while maximizing user engagement.
