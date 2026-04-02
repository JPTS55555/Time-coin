import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { Mic, MicOff, Send, Sparkles, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export function AIAssistant() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string}[]>([
    { role: 'model', text: 'Hi! I am your TimeCoin Assistant. I can help you find local skills, suggest fair trades, or just chat. How can I help you today?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Live API State
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveSession, setLiveSession] = useState<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clean up Live API on unmount
  useEffect(() => {
    return () => {
      stopLiveSession();
    };
  }, []);

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const userMessage = inputText.trim();
    setInputText('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMessage,
        config: {
          systemInstruction: `You are a helpful assistant for the TimeCoin app. TimeCoin is a local micro-skills exchange platform where users trade time instead of money. 1 hour = 1 TimeCoin. The user's name is ${profile?.displayName || 'User'}. Keep answers concise and helpful.`,
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: {
                latitude: 38.7223, // Default to Lisbon for MVP
                longitude: -9.1393
              }
            }
          }
        }
      });

      setMessages(prev => [...prev, { role: 'model', text: response.text || 'Sorry, I could not process that.' }]);
    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: 'Oops, something went wrong connecting to the AI.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  // --- Live API (Voice) Implementation ---
  const startLiveSession = async () => {
    try {
      setIsLiveActive(true);
      
      // Setup Audio Context for playback
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      // Request Microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true
      }});
      mediaStreamRef.current = stream;

      // Connect to Live API
      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onopen: () => {
            console.log("Live API Connected");
            
            // Setup Audio Capture
            if (!audioContextRef.current) return;
            const source = audioContextRef.current.createMediaStreamSource(stream);
            const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;
            
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              // Convert Float32Array to Int16Array (PCM)
              const pcmData = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
              }
              
              // Base64 encode
              const buffer = new ArrayBuffer(pcmData.length * 2);
              const view = new DataView(buffer);
              for (let i = 0; i < pcmData.length; i++) {
                view.setInt16(i * 2, pcmData[i], true);
              }
              
              let binary = '';
              const bytes = new Uint8Array(buffer);
              for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              const base64Data = btoa(binary);

              sessionPromise.then(session => {
                session.sendRealtimeInput({
                  audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                });
              });
            };

            source.connect(processor);
            processor.connect(audioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
              const binaryString = atob(base64Audio);
              const len = binaryString.length;
              const bytes = new Uint8Array(len);
              for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              
              try {
                const audioBuffer = await audioContextRef.current.decodeAudioData(bytes.buffer);
                const source = audioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContextRef.current.destination);
                source.start();
              } catch (e) {
                console.error("Error decoding audio", e);
              }
            }
          },
          onerror: (error) => {
            console.error("Live API Error:", error);
            stopLiveSession();
          },
          onclose: () => {
            console.log("Live API Closed");
            stopLiveSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } }
          },
          systemInstruction: "You are a helpful voice assistant for the TimeCoin app. Keep your answers very short and conversational."
        }
      });

      setLiveSession(sessionPromise);

    } catch (error) {
      console.error("Failed to start live session:", error);
      setIsLiveActive(false);
    }
  };

  const stopLiveSession = () => {
    setIsLiveActive(false);
    
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (liveSession) {
      liveSession.then((session: any) => {
        if (session && typeof session.close === 'function') {
          session.close();
        }
      });
      setLiveSession(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="p-4 border-b border-gray-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center space-x-2">
          <Sparkles className="text-indigo-600" size={24} />
          <h1 className="text-xl font-bold text-gray-900">AI Assistant</h1>
        </div>
        
        <button
          onClick={isLiveActive ? stopLiveSession : startLiveSession}
          className={`px-4 py-2 rounded-full flex items-center space-x-2 text-sm font-medium transition-colors ${
            isLiveActive 
              ? 'bg-red-100 text-red-600 hover:bg-red-200' 
              : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
          }`}
        >
          {isLiveActive ? <MicOff size={16} /> : <Mic size={16} />}
          <span>{isLiveActive ? 'Stop Voice' : 'Voice Chat'}</span>
        </button>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50">
        {isLiveActive && (
          <div className="flex justify-center mb-4">
            <div className="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2 animate-pulse shadow-lg">
              <Mic size={16} />
              <span>Listening... Speak now</span>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[85%] rounded-2xl p-4 ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-br-none' 
                  : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none p-4 shadow-sm flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendText} className="p-4 bg-white border-t border-gray-100">
        <div className="flex items-center bg-gray-50 rounded-2xl border border-gray-200 p-2 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask about local skills..."
            disabled={isLiveActive}
            className="flex-1 bg-transparent px-3 py-2 outline-none text-sm disabled:opacity-50"
          />
          <button 
            type="submit"
            disabled={!inputText.trim() || isTyping || isLiveActive}
            className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:bg-gray-400"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
