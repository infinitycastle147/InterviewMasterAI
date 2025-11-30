import React from 'react';
import { Terminal } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200 relative overflow-x-hidden">
      {/* Background Gradient Mesh */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/10 rounded-full blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-3xl opacity-50"></div>
      </div>

      <header className="border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm shadow-black/20">
        <div className="max-w-5xl mx-auto px-6 h-18 flex items-center justify-between h-16">
          <div className="flex items-center gap-3 group cursor-default">
            <div className="p-2 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/30 transition-shadow">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-xl tracking-tight text-white">
              InterviewMaster <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">AI</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden sm:block text-[10px] font-bold tracking-widest text-gray-600 px-2 py-1 border border-gray-800 rounded uppercase">
                Beta
             </div>
             <div className="text-xs font-medium text-gray-400 px-3 py-1.5 bg-gray-900 rounded-full border border-gray-800/60 shadow-inner">
                v1.0.0
             </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-5xl mx-auto p-6 relative z-10">
        {children}
      </main>
      
      <footer className="border-t border-gray-800/60 py-10 mt-12 bg-gray-950/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} InterviewMaster AI.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-gray-300 transition-colors cursor-pointer">Privacy</span>
            <span className="hover:text-gray-300 transition-colors cursor-pointer">Terms</span>
            <span className="text-gray-600">|</span>
            <span className="text-indigo-500/80">Powered by Gemini 2.5</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
