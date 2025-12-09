import React, { useState, useEffect } from 'react';
import { RefreshCw, FileText, Play, Code2, AlertCircle, Settings2, Hash, ChevronRight, Github, Layers } from 'lucide-react';
import { RepoFile, Question } from '../types';
import { DEMO_QUESTIONS_MARKDOWN } from '../constants';

interface DashboardProps {
  files: RepoFile[];
  onStartQuiz: (questions: Question[]) => void;
  onSync: () => void;
  isSyncing: boolean;
}

const parseQuestions = (markdown: string): Question[] => {
  const lines = markdown.split('\n');
  const questions: Question[] = [];
  let currentQuestion: Partial<Question> | null = null;
  let currentLines: string[] = [];
  let inCodeBlock = false;

  const questionStartRegex = /^\s*(\d+)[\.\)]\s*(.*)/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fenceCount = (line.match(/```/g) || []).length;
    let lineTogglesState = false;
    if (fenceCount > 0 && fenceCount % 2 === 1) {
      lineTogglesState = true;
    }

    const isQuestionLine = !inCodeBlock && questionStartRegex.test(line);

    if (isQuestionLine) {
      const match = line.match(questionStartRegex);
      if (match) {
        if (currentQuestion) {
          currentQuestion.rawText = currentLines.join('\n').trim();
          questions.push(currentQuestion as Question);
        }
        currentQuestion = {
          id: `q-${Date.now()}-${questions.length}`,
          processed: false
        };
        currentLines = [match[2]]; 
      }
    } else {
      if (currentQuestion) {
        currentLines.push(line);
      }
    }

    if (lineTogglesState) {
      inCodeBlock = !inCodeBlock;
    }
  }

  if (currentQuestion) {
    currentQuestion.rawText = currentLines.join('\n').trim();
    questions.push(currentQuestion as Question);
  }

  return questions;
};

export const Dashboard: React.FC<DashboardProps> = ({ files, onStartQuiz, onSync, isSyncing }) => {
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
      
      {/* Hero Section */}
      <div className="text-center py-12 md:py-20 relative">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-900/30 border border-indigo-500/30 text-indigo-300 text-xs font-medium mb-6 animate-pulse">
           <Code2 className="w-3.5 h-3.5" /> AI-Powered Technical Assessment
        </div>
        <h2 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight leading-tight">
          Master Your <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400">Technical Interview</span>
        </h2>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Sync your personal question bank from GitHub, predict code outputs, and receive instant AI validation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Source Selection - Spans 7 columns */}
        <div className="lg:col-span-7 bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-1 shadow-2xl flex flex-col h-full">
           <div className="p-6 md:p-8 flex-1">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-indigo-400" />
                    Question Bank
                  </h3>
                  <p className="text-sm text-gray-500">Select a topic to generate your quiz</p>
                </div>
                <button
                  onClick={onSync}
                  disabled={isSyncing}
                  className="px-4 py-2 text-sm font-semibold bg-gray-800 hover:bg-gray-700 text-white rounded-xl border border-gray-700 transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Sync GitHub'}
                </button>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {files.length === 0 ? (
                  <div className="text-center py-12 px-4 bg-gray-800/30 rounded-2xl border border-gray-800 border-dashed">
                      <div className="bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Github className="w-8 h-8 text-gray-600" />
                      </div>
                      <h4 className="text-gray-300 font-medium mb-1">No repositories synced</h4>
                      <p className="text-sm text-gray-500 mb-4">Sync your GitHub repo or try the demo below.</p>
                      <button 
                         onClick={handleSelectDemo}
                         className="text-indigo-400 hover:text-indigo-300 text-sm font-medium underline underline-offset-4"
                      >
                        Load Demo Questions
                      </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleSelectMixed}
                      className={`group w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
                        useMixed
                          ? 'bg-purple-600/10 border-purple-500 text-white shadow-lg shadow-purple-900/20'
                          : 'bg-gray-800/40 border-gray-800 text-gray-400 hover:bg-gray-800 hover:border-gray-700 hover:text-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${useMixed ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-800 text-gray-600'}`}>
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-semibold block">All Topics (Mixed)</span>
                          <span className="text-xs text-purple-500/70 font-medium">Random questions from all files</span>
                        </div>
                      </div>
                      {useMixed && <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>}
                    </button>

                    {files.map((file, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectFile(file)}
                        className={`group w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
                          selectedFile === file && !useDemo && !useMixed
                            ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-lg shadow-indigo-900/20'
                            : 'bg-gray-800/40 border-gray-800 text-gray-400 hover:bg-gray-800 hover:border-gray-700 hover:text-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${selectedFile === file && !useDemo && !useMixed ? 'bg-indigo-500/20 text-indigo-400' : 'bg-gray-800 text-gray-600'}`}>
                            <Hash className="w-4 h-4" />
                          </div>
                          <span className="font-semibold">{file.name}</span>
                        </div>
                        {selectedFile === file && !useDemo && !useMixed && <ChevronRight className="w-4 h-4 text-indigo-400" />}
                      </button>
                    ))}
                  </>
                )}
                
                {files.length > 0 && (
                   <button
                   onClick={handleSelectDemo}
                   className={`group w-full text-left p-4 rounded-2xl border transition-all duration-200 mt-4 flex items-center justify-between ${
                     useDemo
                       ? 'bg-emerald-600/10 border-emerald-500 text-white shadow-lg shadow-emerald-900/20'
                       : 'bg-gray-800/40 border-gray-800 text-gray-400 hover:bg-gray-800 hover:border-gray-700 hover:text-gray-200'
                   }`}
                 >
                   <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${useDemo ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-600'}`}>
                           <Code2 className="w-4 h-4" />
                      </div>
                     <div>
                        <span className="font-semibold block">Demo Mode</span>
                        <span className="text-xs text-emerald-500/70 font-medium">Standard JavaScript Questions</span>
                     </div>
                   </div>
                   {useDemo && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>}
                 </button>
                )}
              </div>
           </div>
        </div>

        {/* Configuration - Spans 5 columns */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 shadow-2xl flex-1 flex flex-col">
              <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-indigo-400" />
                Configuration
              </h3>

              <div className="space-y-8 flex-1">
                 {/* Selected Topic Display */}
                 <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl opacity-20 group-hover:opacity-30 transition duration-500 blur"></div>
                    <div className="relative bg-gray-950 rounded-xl p-5 border border-gray-800">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Topic</div>
                        <div className="text-lg font-medium truncate flex items-center gap-2">
                            {useDemo ? (
                                <span className="text-emerald-400 flex items-center gap-2"><Code2 className="w-4 h-4"/> Demo JS Questions</span>
                            ) : useMixed ? (
                                <span className="text-purple-400 flex items-center gap-2"><Layers className="w-4 h-4"/> All Topics (Mixed)</span>
                            ) : selectedFile ? (
                                <span className="text-indigo-400 flex items-center gap-2"><FileText className="w-4 h-4"/> {selectedFile.name}</span>
                            ) : (
                                <span className="text-gray-600 italic">Select a topic from the list</span>
                            )}
                        </div>
                    </div>
                 </div>

                 {/* Slider */}
                 <div className="bg-gray-950/50 rounded-xl p-6 border border-gray-800">
                    <div className="flex justify-between items-end mb-6">
                        <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Number of Questions</label>
                        <div className="text-2xl font-bold text-white font-mono bg-gray-800 px-3 py-1 rounded-lg border border-gray-700 min-w-[3ch] text-center">
                          {questionCount}
                        </div>
                    </div>
                    
                    <input
                        type="range"
                        min="1"
                        max={maxQuestions || 1}
                        value={questionCount}
                        onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                        disabled={!selectedFile && !useDemo && !useMixed}
                        className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    />
                    <div className="flex justify-between text-xs font-medium text-gray-500 mt-3 font-mono">
                        <span>1</span>
                        <span>{maxQuestions > 0 ? maxQuestions : '-'} MAX</span>
                    </div>
                 </div>
              </div>

              <button
                onClick={handleStart}
                disabled={(!selectedFile && !useDemo && !useMixed) || maxQuestions === 0}
                className={`w-full py-5 mt-8 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-xl ${
                (!selectedFile && !useDemo && !useMixed) || maxQuestions === 0
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-1'
                }`}
            >
                Start Interview
                <Play className="w-5 h-5 fill-current" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};