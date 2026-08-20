# 📚 Adaptive Multi-Modal AI Learning System

An intelligent educational platform designed to transform complex learning materials into accessible, engaging, and multi-dimensional content. It adapts to different learning styles, accessibility needs, and languages, enhancing the learning experience with interactive quizzes, AI illustrations, smart video recommendations, and audio narration.

---

## 🌟 Key Features

### 1. **Selective Intelligence Workflow**
Instead of static generation, the application uses an interactive, step-based selection flow. You input your text, and the AI routes the content based on the chosen path:
- **Simplified**: Optimized for introductory learners (4th-grade comprehension level).
- **Advanced**: High-level, academic, and rigorous terminology for deep study.
- **Accessibility**: Optimized with clean semantic markup for screen readers and high readability.
- **Emoji Version**: A visual, engaging translation of the lesson utilizing descriptive icons.

### 2. **Universal Document Extraction**
Upload existing study materials in various formats. The platform processes and extracts content from:
- **PDFs** (`.pdf`): Server-side extraction for multi-page documents.
- **Word Docs** (`.docx`): Parsing of Microsoft Word files using Mammoth.js.
- **Text Files** (`.txt`): Instant local file reading and text loading.

### 3. **Interactive AI Quizzes**
Turn any lesson into an active learning check. The system generates 3-question Multiple Choice Quizzes (MCQs) with instant evaluation, score feedback, and rationale explanations.

### 4. **Multi-Language Inclusion**
Translate and adapt study material into major **Indian Languages** (Telugu, Tamil, Kannada, Marathi, Hindi, etc.) as well as global languages (Spanish, French, Japanese).

### 5. **Multimedia Enrichment**
- **AI Illustrations**: Generates educational diagrams and concepts using Stable Diffusion.
- **Smart Video Search**: Automatically extracts search intent to display the most relevant educational YouTube video for the topic.
- **Voice Narration**: High-quality text-to-speech built directly into the dashboard using Web Speech API.

---

## 🧠 AI Models Architecture

To maximize uptime and performance, the platform implements a multi-model routing strategy via OpenRouter and Hugging Face:

| Feature | Model | Rationale |
| :--- | :--- | :--- |
| **Logic & Rewriting** | `google/gemini-2.0-flash-001` | Fast reasoning, high-context window, precise structure. |
| **Translation** | `google/gemini-flash-1.5` | Exceptional multilingual capabilities and translation fidelity. |
| **Image Generation** | `Stable Diffusion 2.1` | High-fidelity scientific illustrations and educational diagrams. |
| **Video Search Intent**| `google/gemini-2.0-flash-001` | Semantic search query extraction. |

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Lucide React (Icons), jsPDF (PDF export)
- **Styling**: Vanilla CSS with modern Glassmorphism ("Aero" UI aesthetic)
- **Build Tool**: Vite 8
- **Backend/Middleware**: Node.js server (Vite Middleware proxy) to bypass CORS and securely route API keys.
- **Document Processing**: `pdf-parse`, `mammoth`, `office-text-extractor`

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_GITHUB_USERNAME/adaptive-multi-modal-ai-learning-system.git
   cd adaptive-multi-modal-ai-learning-system
