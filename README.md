<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# InterviewMaster AI

Master your technical interviews with AI-powered assessments. Sync your personal question bank from GitHub, predict code outputs, and receive instant AI validation.

## Features

- **GitHub Integration**: Sync markdown files containing interview questions directly from your GitHub repositories.
- **AI-Powered Quiz**: Predict outputs for code snippets and get instant feedback from Gemini AI.
- **Live Interview Mode (Beta)**: Experience a real-time voice interview with AI.
- **Dashboard**: sleek and modern dashboard to manage your question banks and track progress.
- **Detailed Results**: Review your answers and see where you can improve.

## Getting Started

Follow these steps to run the application locally.

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- A Google Gemini API Key

### Installation

1.  Clone the repository:

    ```bash
    git clone <repository-url>
    cd InterviewMasterAI
    ```

2.  Install dependencies:

    ```bash
    npm install
    ```

3.  Set up environment variables:

    - Create a `.env` file in the root directory (or `.env.local`).
    - Add your Gemini API key:
      ```
      GEMINI_API_KEY=your_api_key_here
      ```

4.  Run the development server:

    ```bash
    npm run dev
    ```

5.  Open your browser and navigate to `http://localhost:5173`.

## Project Structure

- **`src/`**: Main source code (currently flat structure in root for some files).
- **`components/`**: React components.
- **`services/`**: API and logic services (Gemini, Sandbox).
- **`utils/`**: Utility functions.
- **`types.ts`**: TypeScript definitions.

## Technologies Used

- React 19
- Vite
- Tailwind CSS
- Google Gemini API
- Lucide React (Icons)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
