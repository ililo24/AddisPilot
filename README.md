<div align="center">
  <h1>🚀 Addis Pilot: The AI Tutor</h1>
  <p><strong>An offline-ready, AI-powered educational platform for the Ethiopian curriculum.</strong></p>
</div>

## 📖 Overview

**Addis Pilot** is a comprehensive, interactive learning platform designed for students in Grades 11 and 12. It provides access to Ministry-approved textbooks with intelligent AI features to enhance comprehension and mastery of subjects like Physics, Math, Biology, Chemistry, and English. The application is built to be resilient, offering offline-ready capabilities and a fallback mode when networks are unstable.

## ✨ Key Features

- **📚 Curriculum Alignment**: Tailored specifically for Grades 11 and 12, featuring official Ministry textbooks.
- **🌍 Multi-Language Support**: Seamlessly switch between English, Amharic, and Afaan Oromoo.
- **🤖 Intelligent AI Tutor ("leenjisaa")**: Ask questions directly to the AI tutor, get context-aware explanations of textbook sections, and translate difficult paragraphs on the fly.
- **🧠 Mastery Quizzes**: Automatically generate dynamic, adaptive quizzes from the textbook content you are currently reading to test your knowledge.
- **📶 Offline-Ready & Fallbacks**: Textbooks are proactively cached. The app features multi-proxy fallbacks and an offline demo mode to ensure uninterrupted learning even when online servers go down.
- **👤 3D Avatar & Voice Integration**: Features an animated interactive 3D avatar that provides voice-synthesized explanations for an immersive learning experience.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS (Lucide React for icons)
- **3D & Avatar**: React Three Fiber (`@react-three/fiber`, `@react-three/drei`), Three.js
- **PDF Rendering**: `react-pdf`

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- API Keys (if applicable, e.g., ElevenLabs or Gemini/OpenAI depending on backend config)

### Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository-url>
   cd addis-pilot
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory and add your required API keys (e.g., `GEMINI_API_KEY`).

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```

5. **Build for Production**:
   ```bash
   npm run build
   ```

## 📂 Project Structure

- `/src/components/`: Reusable UI components (PDFReader, Dashboard, Avatar, Auth, etc.).
- `/src/services/`: API services, AI client handlers, and Authentication context.
- `/src/translations.ts`: Localization dictionary for English, Amharic, and Oromo.
- `/public/`: Static assets and offline placeholder PDF files.

## 🤝 Contributing

Contributions are welcome! If you'd like to improve the AI prompts, add more curriculum subjects, or enhance offline capabilities, feel free to open a pull request or submit an issue.

## 📄 License

This project is licensed under the MIT License.
