
import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { QuizSession } from './components/QuizSession';
import { Results } from './components/Results';
import { LiveInterviewSession } from './components/LiveInterviewSession';
import { Question, RepoFile, UserAnswer } from './types';
import { DEFAULT_REPO_URL } from './constants';

enum AppView {
  DASHBOARD = 'DASHBOARD',
  QUIZ = 'QUIZ',
  RESULTS = 'RESULTS',
  LIVE_INTERVIEW = 'LIVE_INTERVIEW'
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
      const response = await fetch(DEFAULT_REPO_URL);
      if (!response.ok) throw new Error("Failed to fetch repo contents");
      
      const data = await response.json();
      const mdFiles = Array.isArray(data) 
        ? data.filter((f: any) => f.name.endsWith('.md'))
            .map((f: any) => ({ name: f.name, download_url: f.download_url }))
        : [];
      
      const filesWithContent = await Promise.all(mdFiles.slice(0, 20).map(async (f: RepoFile) => {
          const contentRes = await fetch(f.download_url);
          const content = await contentRes.text();
          return { ...f, content };
      }));

      setRepoFiles(filesWithContent);
    } catch (error) {
      console.error("Sync failed, utilizing demo mode implicitly in UI", error);
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

  const startLiveInterview = (questions: Question[]) => {
    setActiveQuestions(questions);
    setView(AppView.LIVE_INTERVIEW);
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
          onStartLiveInterview={startLiveInterview}
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
      {view === AppView.LIVE_INTERVIEW && (
        <LiveInterviewSession 
          questions={activeQuestions}
          onEndCall={restart}
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