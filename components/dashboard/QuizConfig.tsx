import React from 'react';
import { Settings2, Code2, Layers, FileText, Play } from 'lucide-react';
import { RepoFile } from '../../types';

interface QuizConfigProps {
    selectedFile: RepoFile | null;
    useDemo: boolean;
    useMixed: boolean;
    questionCount: number;
    maxQuestions: number;
    setQuestionCount: (count: number) => void;
    onStart: () => void;
}

export const QuizConfig: React.FC<QuizConfigProps> = ({
    selectedFile,
    useDemo,
    useMixed,
    questionCount,
    maxQuestions,
    setQuestionCount,
    onStart
}) => {
    return (
        <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 shadow-2xl flex-1 flex flex-col">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-indigo-400" />
                Standard Quiz Config
            </h3>

            <div className="space-y-6 flex-1">
                {/* Selected Topic Display */}
                <div className="relative bg-gray-950 rounded-xl p-5 border border-gray-800">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Topic</div>
                    <div className="text-lg font-medium truncate flex items-center gap-2">
                        {useDemo ? (
                            <span className="text-emerald-400 flex items-center gap-2"><Code2 className="w-4 h-4" /> Demo JS Questions</span>
                        ) : useMixed ? (
                            <span className="text-purple-400 flex items-center gap-2"><Layers className="w-4 h-4" /> All Topics (Mixed)</span>
                        ) : selectedFile ? (
                            <span className="text-indigo-400 flex items-center gap-2"><FileText className="w-4 h-4" /> {selectedFile.name}</span>
                        ) : (
                            <span className="text-gray-600 italic">Select a topic from the list</span>
                        )}
                    </div>
                </div>

                {/* Slider */}
                <div className="bg-gray-950/50 rounded-xl p-6 border border-gray-800">
                    <div className="flex justify-between items-end mb-4">
                        <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Count</label>
                        <div className="text-xl font-bold text-white font-mono bg-gray-800 px-3 py-1 rounded-lg border border-gray-700 min-w-[3ch] text-center">
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
                </div>
            </div>

            <button
                onClick={onStart}
                disabled={(!selectedFile && !useDemo && !useMixed) || maxQuestions === 0}
                className={`w-full py-4 mt-6 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-xl ${(!selectedFile && !useDemo && !useMixed) || maxQuestions === 0
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-1'
                    }`}
            >
                Start Quiz
                <Play className="w-5 h-5 fill-current" />
            </button>
        </div>
    );
};
