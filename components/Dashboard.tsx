import React, { useState, useEffect } from 'react';
import { RepoFile, Question } from '../types';
import { DEMO_QUESTIONS_MARKDOWN } from '../constants';
import { parseQuestions } from '../utils/markdownUtils';
import { HeroSection } from './dashboard/HeroSection';
import { RepoFileList } from './dashboard/RepoFileList';
import { LiveInterviewCard } from './dashboard/LiveInterviewCard';
import { QuizConfig } from './dashboard/QuizConfig';

interface DashboardProps {
  files: RepoFile[];
  onStartQuiz: (questions: Question[]) => void;
  onStartLiveInterview: (questions: Question[]) => void;
  onSync: () => void;
  isSyncing: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  files,
  onStartQuiz,
  onStartLiveInterview,
  onSync,
  isSyncing
}) => {
  const [selectedFile, setSelectedFile] = useState<RepoFile | null>(null);
  const [useDemo, setUseDemo] = useState(false);
  const [useMixed, setUseMixed] = useState(false);
  const [maxQuestions, setMaxQuestions] = useState(0);
  const [questionCount, setQuestionCount] = useState(5);
  const [allParsedQuestions, setAllParsedQuestions] = useState<Question[]>([]);

  useEffect(() => {
    let raw: Question[] = [];
    if (useDemo) {
      raw = parseQuestions(DEMO_QUESTIONS_MARKDOWN);
    } else if (useMixed && files.length > 0) {
      raw = files.flatMap(f => parseQuestions(f.content || ''));
    } else if (selectedFile && selectedFile.content) {
      raw = parseQuestions(selectedFile.content);
    }
    setAllParsedQuestions(raw);
    setMaxQuestions(raw.length);
  }, [selectedFile, useDemo, useMixed, files]);

  useEffect(() => {
    if (maxQuestions > 0) {
      setQuestionCount(prev => {
        const newCount = Math.min(maxQuestions, Math.max(1, prev));
        return newCount === 0 ? Math.min(10, maxQuestions) : newCount;
      });
    } else {
      setQuestionCount(0);
    }
  }, [maxQuestions]);

  const handleStart = () => {
    if (allParsedQuestions.length === 0) return;
    const shuffled = [...allParsedQuestions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const selectedQuestions = shuffled.slice(0, questionCount);
    onStartQuiz(selectedQuestions);
  };

  const handleStartLive = () => {
    // Gather all questions from all files for Live Context
    let allQuestions: Question[] = [];
    if (files.length > 0) {
      allQuestions = files.flatMap(f => parseQuestions(f.content || ''));
    } else {
      allQuestions = parseQuestions(DEMO_QUESTIONS_MARKDOWN);
    }

    // Shuffle and pick a reasonable subset for context window
    const shuffled = [...allQuestions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Pass up to 20 questions to the live session
    onStartLiveInterview(shuffled.slice(0, 20));
  };

  const handleSelectFile = (file: RepoFile) => {
    setSelectedFile(file);
    setUseDemo(false);
    setUseMixed(false);
  };

  const handleSelectDemo = () => {
    setUseDemo(true);
    setSelectedFile(null);
    setUseMixed(false);
  };

  const handleSelectMixed = () => {
    setUseMixed(true);
    setSelectedFile(null);
    setUseDemo(false);
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">

      <HeroSection />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        <RepoFileList
          files={files}
          isSyncing={isSyncing}
          onSync={onSync}
          selectedFile={selectedFile}
          useDemo={useDemo}
          useMixed={useMixed}
          onSelectFile={handleSelectFile}
          onSelectDemo={handleSelectDemo}
          onSelectMixed={handleSelectMixed}
        />

        {/* Configuration - Spans 5 columns */}
        <div className="lg:col-span-5 flex flex-col gap-6">

          <LiveInterviewCard onStartLive={handleStartLive} />

          <QuizConfig
            selectedFile={selectedFile}
            useDemo={useDemo}
            useMixed={useMixed}
            questionCount={questionCount}
            maxQuestions={maxQuestions}
            setQuestionCount={setQuestionCount}
            onStart={handleStart}
          />
        </div>
      </div>
    </div>
  );
};