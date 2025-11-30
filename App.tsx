
import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { QuizSession } from './components/QuizSession';
import { Results } from './components/Results';
import { Question, RepoFile, UserAnswer } from './types';
import { DEFAULT_REPO_URL } from './constants';

enum AppView {
  DASHBOARD = 'DASHBOARD',
  QUIZ = 'QUIZ',
  RESULTS = 'RESULTS'
}

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [repoFiles, setRepoFiles] = useState<RepoFile[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Quiz State
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<Record<string, UserAnswer>>({});

  const syncRepo = async () => {
    setIsSyncing(true);
    try {
      // In a real scenario, this fetches from GitHub API
      // Since we don't have a backend proxy to handle CORS or Rate Limits reliably for the user
      // We will simulate a successful fetch if the URL is valid, or just throw for the demo
      // For this "Product", we can try to fetch the public repo contents if CORS allows, otherwise we fallback.
      
      const response = await fetch(DEFAULT_REPO_URL);
      if (!response.ok) throw new Error("Failed to fetch repo contents");
      
      const data = await response.json();
      // Filter for markdown files
      const mdFiles = Array.isArray(data) 
        ? data.filter((f: any) => f.name.endsWith('.md'))
            .map((f: any) => ({ name: f.name, download_url: f.download_url }))
        : [];
      
      // Fetch content for the first 20 files to ensure we get a good coverage of the question bank
      const filesWithContent = await Promise.all(mdFiles.slice(0, 20).map(async (f: RepoFile) => {
          const contentRes = await fetch(f.download_url);
          const content = await contentRes.text();
          return { ...f, content };
      }));

      setRepoFiles(filesWithContent);
    } catch (error) {
      console.error("Sync failed, utilizing demo mode implicitly in UI", error);
      // In a real app we'd show a toast. Here the Dashboard handles empty state.
    } finally {
      setIsSyncing(false);
    }
  };

  const startQuiz = (questions: Question[]) => {
    setActiveQuestions(questions);
    setScore(0);
    setAnswers({});
    setView(AppView.QUIZ);
  };

  const completeQuiz = (finalScore: number, finalAnswers: Record<string, UserAnswer>) => {
    setScore(finalScore);
    setAnswers(finalAnswers);
    setView(AppView.RESULTS);
  };

  const restart = () => {
    setView(AppView.DASHBOARD);
    setActiveQuestions([]);
  };

  return (
    <Layout>
      {view === AppView.DASHBOARD && (
        <Dashboard 
          files={repoFiles} 
          onStartQuiz={startQuiz} 
          onSync={syncRepo}
          isSyncing={isSyncing}
        />
      )}
      {view === AppView.QUIZ && (
        <QuizSession 
          questions={activeQuestions}
          onComplete={completeQuiz}
          onExit={restart}
        />
      )}
      {view === AppView.RESULTS && (
        <Results 
          score={score}
          total={activeQuestions.length}
          answers={answers}
          onRestart={restart}
        />
      )}
    </Layout>
  );
};

export default App;
