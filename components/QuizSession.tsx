import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Question, QuestionType, UserAnswer } from '../types';
import { analyzeQuestion, validateAnswerWithAI, prepareExecutableCode } from '../services/geminiService';
import { executeCode } from '../services/sandboxService';
import { ArrowRight, ArrowLeft, CheckCircle2, XCircle, Loader2, PlayCircle, LogOut, SkipForward, Code, Play, X, TerminalSquare } from 'lucide-react';

interface QuizSessionProps {
  questions: Question[];
  onComplete: (score: number, answers: Record<string, UserAnswer>) => void;
  onExit: () => void;
}

export const QuizSession: React.FC<QuizSessionProps> = ({ questions, onComplete, onExit }) => {
  const [localQuestions, setLocalQuestions] = useState<Question[]>(questions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  
  const [analyzing, setAnalyzing] = useState(false);
  const [validating, setValidating] = useState(false);
  const [userInput, setUserInput] = useState('');
  
  const [feedback, setFeedback] = useState<UserAnswer | null>(null);
  const [allAnswers, setAllAnswers] = useState<Record<string, UserAnswer>>({});
  const [score, setScore] = useState(0);
  
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // Playground State
  const [showPlayground, setShowPlayground] = useState(false);
  const [playgroundCode, setPlaygroundCode] = useState('');
  const [playgroundOutput, setPlaygroundOutput] = useState('');
  const [isRunningCode, setIsRunningCode] = useState(false);

  useEffect(() => {
    setLocalQuestions(questions);
  }, [questions]);

  useEffect(() => {
    if (localQuestions.length > 0 && currentIndex < localQuestions.length) {
      loadQuestion(currentIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, localQuestions]);

  const loadQuestion = async (index: number) => {
    const q = localQuestions[index];
    const existingAnswer = allAnswers[q.id];
    setFeedback(existingAnswer || null);
    setUserInput(existingAnswer?.userInput || '');
    
    if (q.processed) {
      setCurrentQuestion(q);
      return;
    }

    setAnalyzing(true);
    try {
      const processedData = await analyzeQuestion(q.rawText);
      const processedQuestion = { ...q, ...processedData, processed: true };
      
      setLocalQuestions(prev => {
        const updated = [...prev];
        updated[index] = processedQuestion;
        return updated;
      });
      setCurrentQuestion(processedQuestion);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentQuestion || !userInput) return;
    setValidating(true);

    const result = await validateAnswerWithAI(currentQuestion, userInput);

    const answerRecord: UserAnswer = {
      questionId: currentQuestion.id,
      userInput,
      isCorrect: result.isCorrect || false,
      feedback: result.feedback || '',
      actualOutput: result.actualOutput,
      proof: result.proof,
      timestamp: Date.now()
    };

    setFeedback(answerRecord);
    
    const prevAnswer = allAnswers[currentQuestion.id];
    let scoreDelta = 0;
    if (prevAnswer?.isCorrect) scoreDelta -= 1;
    if (answerRecord.isCorrect) scoreDelta += 1;
    
    setScore(s => s + scoreDelta);
    setAllAnswers(prev => ({ ...prev, [currentQuestion.id]: answerRecord }));
    setValidating(false);
  };

  const openPlayground = async () => {
    if (!currentQuestion?.codeSnippet) return;
    setShowPlayground(true);
    setPlaygroundOutput('Loading executable context...');
    
    const runnable = await prepareExecutableCode(currentQuestion.codeSnippet);
    setPlaygroundCode(runnable);
    setPlaygroundOutput('Ready to run. Click "Run Code".');
  };

  const handleRunPlayground = async () => {
    setIsRunningCode(true);
    const result = await executeCode(playgroundCode);
    setPlaygroundOutput(result.output || result.error || 'No output.');
    setIsRunningCode(false);
  };

  const handleNext = () => {
    if (currentIndex < localQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleEndInterview = () => {
    onComplete(score, allAnswers);
  };

  if (analyzing || !currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-500">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-pulse" />
          </div>
        </div>
        <p className="mt-6 text-indigo-300 font-medium tracking-wide animate-pulse">Analyzing Question with AI...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 relative animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Navigation Bar */}
      <div className="flex justify-between items-center mb-8 sticky top-20 z-30 bg-gray-900/0 py-2">
        <div className="flex items-center gap-4">
           <div className="text-gray-400 text-xs font-bold uppercase tracking-widest bg-gray-900/80 backdrop-blur border border-gray-800 px-4 py-1.5 rounded-full shadow-lg">
            Question {currentIndex + 1} / {localQuestions.length}
          </div>
          <div className="text-indigo-300 font-bold text-xs uppercase tracking-widest bg-indigo-950/80 backdrop-blur border border-indigo-500/30 px-4 py-1.5 rounded-full shadow-lg shadow-indigo-900/20">
            Score: {score}
          </div>
        </div>
        
        {!showEndConfirm ? (
          <button 
            onClick={() => setShowEndConfirm(true)}
            className="text-gray-400 hover:text-rose-400 text-xs font-bold uppercase tracking-wide flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-900/50 hover:bg-rose-950/30 border border-transparent hover:border-rose-500/30 transition-all duration-300"
          >
            <LogOut className="w-3.5 h-3.5" />
            End Interview
          </button>
        ) : (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300 bg-gray-900/90 backdrop-blur px-2 py-1 rounded-full border border-gray-700">
            <span className="text-xs text-gray-300 font-medium pl-2">Are you sure?</span>
            <button 
              onClick={handleEndInterview}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs rounded-full font-bold transition-colors"
            >
              End
            </button>
            <button 
              onClick={() => setShowEndConfirm(false)}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded-full transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Main Question Card */}
      <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 md:p-10 shadow-2xl mb-8 min-h-[400px] relative overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>

        <div className="relative z-10 mb-8">
          <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase border ${
              currentQuestion.type === QuestionType.CODE_PREDICTION ? 'bg-purple-500/10 text-purple-300 border-purple-500/20' :
              currentQuestion.type === QuestionType.MULTIPLE_CHOICE ? 'bg-blue-500/10 text-blue-300 border-blue-500/20' :
              'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
            }`}>
              {currentQuestion.type === QuestionType.CODE_PREDICTION && <TerminalSquare className="w-3 h-3"/>}
              {currentQuestion.type?.replace('_', ' ')}
            </span>
            
            {currentQuestion.codeSnippet && (
              <button 
                onClick={openPlayground}
                className="group flex items-center gap-2 text-xs font-bold text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-600 px-4 py-2 rounded-xl transition-all border border-indigo-500/20 hover:border-indigo-500 shadow-lg shadow-indigo-900/20"
              >
                <Code className="w-4 h-4" />
                Open Sandbox
                <span className="bg-indigo-500/20 px-1.5 rounded text-[10px] group-hover:bg-indigo-500 group-hover:text-white transition-colors">BETA</span>
              </button>
            )}
          </div>

          <div className="prose prose-invert prose-lg max-w-none text-gray-100 font-medium leading-relaxed tracking-wide">
            <ReactMarkdown components={{
               p: ({node, ...props}) => <p className="mb-4 text-xl md:text-2xl leading-normal" {...props} />,
               code: ({node, ...props}) => <code className="bg-gray-800 text-indigo-300 px-1.5 py-0.5 rounded text-base font-mono" {...props} />
            }}>
              {currentQuestion.questionText || ''}
            </ReactMarkdown>
          </div>
        </div>

        {currentQuestion.codeSnippet && (
          <div className="mb-10 relative group rounded-2xl overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gray-950"></div>
            <div className="relative bg-[#0d1117] p-6 font-mono text-sm overflow-x-auto custom-scrollbar text-gray-300 border-l-4 border-indigo-500">
               <pre>{currentQuestion.codeSnippet}</pre>
            </div>
            {/* Hover overlay hint */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <span className="text-[10px] text-gray-500 bg-gray-900/80 px-2 py-1 rounded border border-gray-800">JavaScript</span>
            </div>
          </div>
        )}

        {/* Interaction Area */}
        <div className="space-y-6">
          {!feedback && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              {currentQuestion.type === QuestionType.MULTIPLE_CHOICE && currentQuestion.options ? (
                 <div className="grid grid-cols-1 gap-3">
                   {currentQuestion.options.map((opt, i) => (
                     <button
                       key={i}
                       onClick={() => setUserInput(opt)}
                       className={`p-5 rounded-2xl border text-left transition-all duration-200 group relative overflow-hidden ${
                         userInput === opt 
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/40 transform scale-[1.01]' 
                          : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-gray-600 text-gray-300'
                       }`}
                     >
                       <div className="relative z-10 flex items-center gap-3">
                         <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors ${
                             userInput === opt ? 'border-white bg-white text-indigo-600' : 'border-gray-600 text-gray-500 group-hover:border-gray-500'
                         }`}>
                             {String.fromCharCode(65 + i)}
                         </div>
                         <ReactMarkdown className="prose prose-invert prose-sm">{opt}</ReactMarkdown>
                       </div>
                     </button>
                   ))}
                 </div>
              ) : (
                <div className="relative">
                   <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-2xl blur opacity-0 transition duration-500 hover:opacity-100"></div>
                   <div className="relative">
                        <label className="block text-gray-500 text-xs font-bold tracking-widest uppercase mb-3 ml-1">
                            {currentQuestion.type === QuestionType.CODE_PREDICTION ? "Your Prediction" : "Your Answer"}
                        </label>
                        <textarea
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            className="w-full bg-gray-950/80 border border-gray-700 rounded-2xl p-5 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono text-sm min-h-[140px] shadow-inner"
                            placeholder={currentQuestion.type === QuestionType.CODE_PREDICTION ? "// Type the output you expect..." : "Type your answer here..."}
                        />
                   </div>
                </div>
              )}
            </div>
          )}

          {/* Feedback Display */}
          {feedback && (
            <div className={`rounded-2xl p-8 border backdrop-blur-md shadow-xl animate-in zoom-in-95 duration-300 ${
                feedback.isCorrect 
                ? 'bg-emerald-950/20 border-emerald-500/30 shadow-emerald-900/10' 
                : 'bg-rose-950/20 border-rose-500/30 shadow-rose-900/10'
            }`}>
              <div className="flex items-start gap-5">
                <div className={`p-2 rounded-full shrink-0 ${feedback.isCorrect ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                    {feedback.isCorrect ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    ) : (
                    <XCircle className="w-8 h-8 text-rose-400" />
                    )}
                </div>
                
                <div className="w-full min-w-0">
                  <h4 className={`font-black text-xl mb-2 tracking-tight ${feedback.isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {feedback.isCorrect ? 'Correct Answer!' : 'Incorrect'}
                  </h4>
                  
                  <div className="text-gray-200 mb-6 text-base leading-relaxed prose prose-invert max-w-none">
                     <ReactMarkdown>{feedback.feedback}</ReactMarkdown>
                  </div>
                  
                  {feedback.proof && (
                    <div className="bg-[#0f111a] rounded-xl border border-gray-800 overflow-hidden">
                      <div className="bg-gray-800/50 px-4 py-2 border-b border-gray-800 flex items-center gap-2">
                        <TerminalSquare className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Verification Proof</span>
                      </div>
                      <div className="p-4 text-xs font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap">
                         {feedback.proof}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-6 flex justify-end border-t border-gray-800/50 mt-6">
            {!feedback ? (
              <button
                onClick={handleSubmit}
                disabled={validating || !userInput}
                className={`px-8 py-4 rounded-xl font-bold text-base flex items-center gap-3 shadow-lg transition-all duration-300 ${
                  validating || !userInput
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25 hover:-translate-y-1'
                }`}
              >
                {validating ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {validating ? 'Analyzing with AI...' : 'Submit Answer'}
              </button>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-500 italic bg-gray-900/50 px-4 py-2 rounded-lg border border-gray-800">
                <ArrowRight className="w-4 h-4 animate-bounce-x" />
                Use controls below to proceed
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="flex justify-between items-center bg-gray-900/90 backdrop-blur-lg border border-gray-800 p-2 rounded-2xl shadow-2xl sticky bottom-6 z-40">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
            currentIndex === 0 
              ? 'text-gray-700 cursor-not-allowed' 
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </button>

        {/* Progress Dots - Hidden on Mobile */}
        <div className="hidden md:flex gap-1.5 px-4 overflow-x-auto max-w-[300px] scrollbar-hide">
            {localQuestions.map((_, idx) => (
                <div 
                    key={idx}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                        idx === currentIndex ? 'bg-indigo-500 scale-125 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 
                        allAnswers[localQuestions[idx].id] ? (
                            allAnswers[localQuestions[idx].id].isCorrect ? 'bg-emerald-500/40' : 'bg-rose-500/40'
                        ) : 'bg-gray-800'
                    }`}
                />
            ))}
        </div>

        {currentIndex === localQuestions.length - 1 ? (
             <button
             onClick={handleEndInterview}
             className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5"
           >
             Finish Interview
             <CheckCircle2 className="w-4 h-4" />
           </button>
        ) : (
            <button
            onClick={handleNext}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all ${
                !feedback 
                 ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                 : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:-translate-y-0.5'
            }`}
          >
            {!feedback ? 'Skip' : 'Next Question'}
            {!feedback ? <SkipForward className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Sandbox Playground Modal */}
      {showPlayground && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#0d1117] border border-gray-700 rounded-2xl w-full max-w-5xl h-[80vh] min-h-[600px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800 bg-[#161b22]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <Code className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                    <h3 className="text-white font-bold text-sm">JS Playground</h3>
                    <p className="text-xs text-gray-500">Experimental Sandbox Environment</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPlayground(false)}
                className="text-gray-400 hover:text-white p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Split View */}
            <div className="flex-1 flex flex-col md:flex-row min-h-0">
               {/* Editor Side */}
               <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-gray-800 relative group">
                  <div className="bg-[#0d1117] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 border-b border-gray-800 flex justify-between items-center select-none">
                    <span>Editor (index.js)</span>
                    <span className="text-gray-600">Auto-formatted</span>
                  </div>
                  <textarea
                    value={playgroundCode}
                    onChange={(e) => setPlaygroundCode(e.target.value)}
                    className="flex-1 w-full bg-[#0d1117] text-gray-300 font-mono text-sm p-6 resize-none focus:outline-none selection:bg-indigo-500/30 leading-relaxed"
                    spellCheck={false}
                  />
               </div>
               
               {/* Console Side */}
               <div className="md:w-[40%] flex flex-col bg-[#010409]">
                  <div className="bg-[#161b22] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 border-b border-gray-800 flex justify-between items-center select-none">
                    <span>Console Output</span>
                    <button onClick={() => setPlaygroundOutput('')} className="hover:text-white transition-colors">Clear</button>
                  </div>
                  <div className="flex-1 p-6 font-mono text-xs overflow-auto whitespace-pre-wrap text-gray-300 custom-scrollbar">
                    {playgroundOutput ? (
                        <span className={playgroundOutput.startsWith('Error') || playgroundOutput.includes('Error:') ? 'text-rose-400' : 'text-emerald-400'}>
                            {playgroundOutput}
                        </span>
                    ) : (
                        <span className="text-gray-700 italic">// Run code to see output...</span>
                    )}
                  </div>
               </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-800 flex justify-between items-center bg-[#161b22]">
              <div className="text-xs text-gray-500 hidden sm:block">
                 <span className="text-orange-400">Note:</span> Code runs in a local sandbox. Browser APIs may be limited.
              </div>
              <button
                onClick={handleRunPlayground}
                disabled={isRunningCode}
                className="ml-auto bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/20 active:translate-y-0.5"
              >
                {isRunningCode ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                Run Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
