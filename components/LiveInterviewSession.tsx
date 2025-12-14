import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage } from "@google/genai";
import { Mic, MicOff, PhoneOff, Activity, Loader2, Zap, AlertCircle, RefreshCw } from 'lucide-react';
import { Question } from '../types';

interface LiveInterviewSessionProps {
  questions: Question[];
  onEndCall: () => void;
}

// Audio Helpers for Gemini Live API
function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }

  let binary = '';
  const bytes = new Uint8Array(int16.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  return {
    data: base64,
    mimeType: 'audio/pcm;rate=16000',
  };
}

function decodeAudio(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const LiveInterviewSession: React.FC<LiveInterviewSessionProps> = ({ questions, onEndCall }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error' | 'ended'>('connecting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [volumeLevel, setVolumeLevel] = useState(0); // For visualizer
  const [aiSpeaking, setAiSpeaking] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<Promise<any> | null>(null);

  // Audio Context Refs
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    startSession();
    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cleanup = () => {
    setStatus('ended');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (inputContextRef.current) {
      inputContextRef.current.close();
    }
    if (outputContextRef.current) {
      outputContextRef.current.close();
    }
    if (sessionRef.current) {
      sessionRef.current.then(session => {
        if (session && typeof session.close === 'function') {
          session.close();
        }
      }).catch(e => console.warn("Error closing session", e));
    }
  };

  const startSession = async () => {
    setStatus('connecting');
    setErrorMessage(null);
    try {
      // 1. Get User Media (Audio Only)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 2. Initialize Audio Contexts
      // Input: 16kHz required by Gemini
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      inputContextRef.current = inputCtx;

      // Output: 24kHz required by Gemini Output
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      outputContextRef.current = outputCtx;

      // Ensure contexts are running (browsers sometimes suspend them)
      if (inputCtx.state === 'suspended') await inputCtx.resume();
      if (outputCtx.state === 'suspended') await outputCtx.resume();

      const outputNode = outputCtx.createGain();
      outputNode.connect(outputCtx.destination);

      // 3. Connect to Gemini Live
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is missing from environment.");

      const ai = new GoogleGenAI({ apiKey });

      // Improved Context Formatting for Accuracy
      const questionContext = questions.slice(0, 10).map((q, i) =>
        `QUESTION #${i + 1} (${q.type}):
         TEXT: ${q.questionText}
         ${q.codeSnippet ? `CODE SNIPPET:\n${q.codeSnippet}` : ''}
         ${q.options ? `OPTIONS: ${q.options.join(', ')}` : ''}
         ---`
      ).join('\n');

      const systemInstruction = `
        You are a Principal Software Engineer at a FAANG company conducting a high-stakes technical phone screen.
        
        YOUR OBJECTIVE:
        Accurately assess the candidate's deep technical understanding. Do not settle for surface-level answers.

        BEHAVIOR & TONE:
        - Professional, direct, and efficient.
        - Voice-only context: Explicitly describe code behavior if discussing it.
        - Short responses: Keep your turns under 4 sentences to allow the candidate to speak.

        EVALUATION PROCESS:
        1. Select a question from the provided context randomly.
        2. Ask the question clearly.
        3. Listen to the user's answer.
        4. CRITICAL: If they are vague, ask "Can you explain specifically how X works?" or "What happens in memory when you do that?".
        5. CRITICAL: If they are wrong, politely correct them ("Actually, that's not quite right because...") and move to the next topic.
        6. Do not give away the answer immediately. Ask a hint first.

        CONTEXT (Interview Questions):
        ${questionContext}

        Start by briefly introducing yourself as the interviewer and asking them if they are ready for the first technical question.
      `;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.0-flash-exp',
        config: {
          responseModalities: ['AUDIO'] as any,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } },
          },
          systemInstruction: { parts: [{ text: systemInstruction }] },
        },
        callbacks: {
          onopen: () => {
            console.log("Session Opened");
            setStatus('connected');

            // Setup Input Stream Processing
            const source = inputCtx.createMediaStreamSource(stream);
            // Use ScriptProcessor for raw PCM access
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);

            processor.onaudioprocess = (e) => {
              // Double check context state
              if (inputContextRef.current?.state === 'suspended') {
                inputContextRef.current.resume();
                return;
              }

              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);

              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              }).catch(err => {
                // Suppress send errors if session is closed/erroring
                if (status !== 'error' && status !== 'ended') {
                  console.debug("Send input failed", err);
                }
              });
            };

            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;

            if (base64Audio) {
              setAiSpeaking(true);
              setVolumeLevel(Math.random() * 100);

              const audioBuffer = await decodeAudioData(
                decodeAudio(base64Audio),
                outputCtx,
                24000,
                1
              );

              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNode);

              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) {
                  setVolumeLevel(0);
                  setAiSpeaking(false);
                }
              });

              // Schedule playback
              const currentTime = outputCtx.currentTime;
              if (nextStartTimeRef.current < currentTime) {
                nextStartTimeRef.current = currentTime;
              }

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            // Handle interruption
            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setVolumeLevel(0);
              setAiSpeaking(false);
            }
          },
          onclose: () => {
            console.log("Session Closed");
            if (status !== 'error') setStatus('ended');
          },
          onerror: (err) => {
            console.error("Session Error", err);
            setStatus('error');
            setErrorMessage(err.message || "Network connection failed");
          }
        }
      });

      sessionRef.current = sessionPromise;

    } catch (err: any) {
      console.error("Failed to start session", err);
      setStatus('error');
      setErrorMessage(err.message || "Failed to initialize audio or network.");
    }
  };

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => t.enabled = !isMuted);
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-950 z-50 flex flex-col animate-in fade-in duration-500 font-sans">

      {/* Modern Header */}
      <div className="absolute top-0 left-0 right-0 p-8 z-20 flex justify-between items-start pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <div className="bg-gray-900/80 backdrop-blur-xl px-5 py-2.5 rounded-full border border-gray-800 shadow-2xl flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${status === 'connected' ? 'bg-emerald-500 animate-pulse' : status === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
            <div className="flex flex-col">
              <h3 className="text-sm font-bold text-white leading-none mb-1">Voice Interview</h3>
              <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">
                {status === 'connected' ? 'Live Connection' : status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Visualization Stage */}
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">

        {/* Background Ambience */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse-slow"></div>
          <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px]"></div>
        </div>

        {/* Central AI Entity */}
        <div className="relative z-10 flex flex-col items-center">

          {status === 'error' ? (
            <div className="flex flex-col items-center text-center p-6 bg-red-500/10 border border-red-500/20 rounded-3xl backdrop-blur-md max-w-md mx-4">
              <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Connection Error</h2>
              <p className="text-red-200 mb-6">{errorMessage || "Unable to establish connection with Gemini Live."}</p>
              <div className="flex gap-4">
                <button
                  onClick={onEndCall}
                  className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold transition-all"
                >
                  Close
                </button>
                <button
                  onClick={startSession}
                  className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Retry
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* The Orb */}
              <div className={`relative transition-all duration-300 ${aiSpeaking ? 'scale-110' : 'scale-100'}`}>
                {/* Core */}
                <div className={`w-40 h-40 md:w-56 md:h-56 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-600 shadow-[0_0_80px_rgba(79,70,229,0.3)] flex items-center justify-center relative z-20 transition-all duration-200 ${aiSpeaking ? 'animate-spin-slow' : ''}`}>
                  <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center">
                    <Zap className={`w-12 h-12 text-white/90 transition-all duration-200 ${aiSpeaking ? 'opacity-100 scale-110' : 'opacity-50 scale-100'}`} />
                  </div>
                </div>

                {/* Dynamic Rings */}
                {aiSpeaking && (
                  <>
                    <div className="absolute inset-0 border-2 border-indigo-400/30 rounded-full animate-ping z-10"></div>
                    <div className="absolute -inset-4 border border-indigo-500/20 rounded-full animate-pulse z-0 delay-75"></div>
                    <div className="absolute -inset-8 border border-purple-500/10 rounded-full animate-pulse z-0 delay-150"></div>
                  </>
                )}
              </div>

              {/* Status Text */}
              <div className="mt-12 text-center space-y-2">
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                  {status === 'connecting' ? 'Connecting...' : 'AI Interviewer'}
                </h2>
                <div className="h-6 flex items-center justify-center">
                  {status === 'connecting' && (
                    <span className="text-indigo-400 font-medium animate-pulse flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Establishing Uplink
                    </span>
                  )}
                  {status === 'connected' && (
                    <span className={`text-sm font-bold tracking-widest uppercase transition-colors duration-300 ${aiSpeaking ? 'text-indigo-400' : 'text-gray-500'}`}>
                      {aiSpeaking ? 'Speaking' : 'Listening'}
                    </span>
                  )}
                  {status === 'ended' && <span className="text-gray-500 font-bold">Session Ended</span>}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="relative z-30 pb-12 pt-6 px-6">
        <div className="max-w-xl mx-auto bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-3xl p-4 shadow-2xl flex items-center justify-between">

          {/* User Status */}
          <div className="flex items-center gap-3 pl-2">
            <div className={`p-3 rounded-full ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </div>
            <div className="hidden md:block">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Your Mic</div>
              <div className={`text-sm font-medium ${isMuted ? 'text-red-400' : 'text-emerald-400'}`}>
                {isMuted ? 'Muted' : 'Active'}
              </div>
            </div>
          </div>

          {/* Center Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleMute}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 border ${isMuted
                ? 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20'
                : 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:border-gray-600'
                }`}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            <button
              onClick={onEndCall}
              className="h-14 px-8 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-red-900/20 hover:scale-105 active:scale-95"
            >
              <PhoneOff className="w-5 h-5" />
              <span className="hidden sm:inline">End Call</span>
            </button>
          </div>

          {/* Visualizer Hint */}
          <div className="flex items-center gap-3 pr-2 justify-end">
            <div className="hidden md:block text-right">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Signal</div>
              <div className="text-sm font-medium text-indigo-400">Excellent</div>
            </div>
            <div className="p-3 rounded-full bg-indigo-500/20 text-indigo-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};