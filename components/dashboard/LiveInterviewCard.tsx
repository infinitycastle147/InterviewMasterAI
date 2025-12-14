import React from 'react';
import { Code2, Video } from 'lucide-react';

interface LiveInterviewCardProps {
    onStartLive: () => void;
}

export const LiveInterviewCard: React.FC<LiveInterviewCardProps> = ({ onStartLive }) => {
    return (
        <div className="bg-gradient-to-br from-indigo-900/40 to-blue-900/40 backdrop-blur-xl border border-indigo-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-32 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/30 transition-all duration-700"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1">
                        <Code2 className="w-3 h-3" /> Beta
                    </div>
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Live AI Interview</h3>
                <p className="text-indigo-200 text-sm mb-6 leading-relaxed">
                    Experience a real-time voice interview. The AI will randomly select questions from your uploaded files and conduct a human-like assessment.
                </p>
                <button
                    onClick={onStartLive}
                    className="w-full py-4 bg-white text-indigo-900 hover:bg-indigo-50 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl active:scale-95"
                >
                    <Video className="w-5 h-5" />
                    Start Live Session
                </button>
            </div>
        </div>
    );
};
