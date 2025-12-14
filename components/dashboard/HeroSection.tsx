import React from 'react';
import { Code2 } from 'lucide-react';

export const HeroSection: React.FC = () => {
    return (
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
    );
};
