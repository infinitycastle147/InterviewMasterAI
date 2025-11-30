import React from 'react';
import { UserAnswer } from '../types';
import { Trophy, RefreshCcw, Check, X, Target, BarChart3, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ResultsProps {
  score: number;
  total: number;
  answers: Record<string, UserAnswer>;
  onRestart: () => void;
}

export const Results: React.FC<ResultsProps> = ({ score, total, answers, onRestart }) => {
  const answerList = (Object.values(answers) as UserAnswer[]).sort((a, b) => a.timestamp - b.timestamp);
  const answeredCount = answerList.length;
  const percentage = answeredCount > 0 ? Math.round((score / answeredCount) * 100) : 0;
  const incorrect = answeredCount - score;

  return (
    <div className="max-w-4xl mx-auto animate-in zoom-in-95 duration-700 pb-20">
      
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center p-6 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full mb-6 ring-1 ring-yellow-500/30 shadow-[0_0_50px_-15px_rgba(234,179,8,0.4)] relative">
          <Trophy className="w-16 h-16 text-yellow-400 drop-shadow-lg" />
          <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-xl animate-pulse"></div>
        </div>
        <h2 className="text-4xl font-black text-white mb-3 tracking-tight">Interview Complete</h2>
        <p className="text-gray-400 text-lg">Performance Summary & Insights</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Accuracy Card */}
        <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <Target className="w-24 h-24 text-indigo-500" />
            </div>
            <div className="relative z-10">
                <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Accuracy</div>
                <div className="text-5xl font-black text-white mb-1">{percentage}<span className="text-2xl text-gray-600">%</span></div>
                <div className="text-xs text-indigo-400 font-medium bg-indigo-500/10 inline-block px-2 py-1 rounded">Based on attempts</div>
            </div>
        </div>

        {/* Breakdown Card */}
        <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-center">
             <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-800">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-gray-300 font-medium">Correct</span>
                </div>
                <span className="text-xl font-bold text-emerald-400">{score}</span>
             </div>
             <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                    <span className="text-gray-300 font-medium">Incorrect</span>
                </div>
                <span className="text-xl font-bold text-rose-400">{incorrect}</span>
             </div>
        </div>

        {/* Completion Card */}
        <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <BarChart3 className="w-24 h-24 text-blue-500" />
            </div>
            <div className="relative z-10">
                <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Completion</div>
                <div className="text-5xl font-black text-white mb-1">{answeredCount}<span className="text-2xl text-gray-600">/{total}</span></div>
                <div className="text-xs text-gray-500 font-medium">Questions answered</div>
            </div>
        </div>
      </div>

      {/* Answer Review Section */}
      <div className="bg-gray-950/50 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl mb-12">
        <div className="bg-gray-900/80 px-8 py-6 border-b border-gray-800 flex justify-between items-center">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                Detailed Review
            </h3>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-widest bg-gray-800 px-3 py-1 rounded-lg">
                {answerList.length} Items
            </span>
        </div>
        
        <div className="divide-y divide-gray-800/50">
            {answerList.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    No questions were answered during this session.
                </div>
            ) : (
                answerList.map((ans, i) => (
                <div key={i} className="p-6 md:p-8 hover:bg-gray-900/30 transition-colors group">
                    <div className="flex items-start gap-4">
                        <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                            ans.isCorrect ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                        }`}>
                            {ans.isCorrect ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Question {i + 1}</span>
                                <span className="text-xs text-gray-600 font-mono">{new Date(ans.timestamp).toLocaleTimeString()}</span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
                                    <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Your Answer</div>
                                    <div className="text-sm text-gray-300 font-medium truncate">{ans.userInput}</div>
                                </div>
                                {!ans.isCorrect && (
                                     <div className="bg-gray-900 rounded-lg p-3 border border-gray-800 opacity-50">
                                        <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Status</div>
                                        <div className="text-sm text-rose-400 font-medium">Incorrect Prediction</div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="text-sm text-gray-400 leading-relaxed border-l-2 border-gray-800 pl-4 py-1">
                                <ReactMarkdown>{ans.feedback}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                </div>
                ))
            )}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={onRestart}
          className="group px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl font-bold text-base border border-gray-700 hover:border-gray-600 transition-all shadow-xl hover:shadow-2xl flex items-center gap-3"
        >
          <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
          Start New Interview
        </button>
      </div>
    </div>
  );
};
