import React from 'react';
import { FileText, RefreshCw, Github, Layers, Hash, ChevronRight, Code2 } from 'lucide-react';
import { RepoFile } from '../../types';

interface RepoFileListProps {
    files: RepoFile[];
    isSyncing: boolean;
    onSync: () => void;
    selectedFile: RepoFile | null;
    useDemo: boolean;
    useMixed: boolean;
    onSelectFile: (file: RepoFile) => void;
    onSelectDemo: () => void;
    onSelectMixed: () => void;
}

export const RepoFileList: React.FC<RepoFileListProps> = ({
    files,
    isSyncing,
    onSync,
    selectedFile,
    useDemo,
    useMixed,
    onSelectFile,
    onSelectDemo,
    onSelectMixed
}) => {
    return (
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
                                onClick={onSelectDemo}
                                className="text-indigo-400 hover:text-indigo-300 text-sm font-medium underline underline-offset-4"
                            >
                                Load Demo Questions
                            </button>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={onSelectMixed}
                                className={`group w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between ${useMixed
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
                                    onClick={() => onSelectFile(file)}
                                    className={`group w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between ${selectedFile === file && !useDemo && !useMixed
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
                            onClick={onSelectDemo}
                            className={`group w-full text-left p-4 rounded-2xl border transition-all duration-200 mt-4 flex items-center justify-between ${useDemo
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
    );
};
