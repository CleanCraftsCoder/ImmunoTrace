import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from '../components/Header';
import { Send, Sparkles, BrainCircuit, Bot, User, Loader2, Leaf } from 'lucide-react';
import { useAuth } from '../lib/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const suggestedQueries = [
  "Why do I keep getting fever?",
  "What patterns do you see in my illnesses?",
  "Suggest a home remedy for cough",
  "Am I taking too many antibiotics?",
];

export function SmartQuery() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || !user) return;

    const userMessage: Message = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          userId: user.id,
          conversationHistory: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: '⚠️ I\'m having trouble connecting to the AI service. Please make sure the server is running (`cd server && npm run dev`).',
          },
        ]);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ Cannot reach the AI server. Make sure the backend is running on port 3003 with `cd server && npm run dev`.',
        },
      ]);
    }

    setIsTyping(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen pt-8 pr-8 pb-12 md:pl-28 flex flex-col">
      <Header />
      <main className="max-w-[900px] mx-auto flex-1 flex flex-col w-full">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex-1 flex flex-col"
        >
          {messages.length === 0 ? (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="text-center mb-12 mt-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-md rounded-full border border-white shadow-sm mb-6 text-[#2EC4B6]">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[11px] font-bold uppercase tracking-widest">ImmunoTrace AI</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-medium text-slate-800 tracking-tight mb-4">
                  Ask your health assistant.
                </h1>
                <p className="text-base text-slate-500 max-w-xl mx-auto">
                  I can answer questions about your medical history, suggest home remedies, and help you understand your health patterns.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-[600px] mb-8">
                {suggestedQueries.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    className="w-full text-left p-4 rounded-2xl bg-white/80 hover:bg-white hover:shadow-md border border-white/60 hover:border-slate-100 transition-all text-sm font-medium text-slate-700 backdrop-blur-xl"
                  >
                    {q}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Leaf className="w-3.5 h-3.5 text-[#2EC4B6]" />
                <span>Powered by your medical records • Ayurvedic remedies included</span>
              </div>
            </div>
          ) : (
            /* Chat messages */
            <div className="flex-1 overflow-y-auto pb-4 space-y-4 mt-4">
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#2EC4B6] to-[#0F3D3E] flex items-center justify-center shrink-0 mt-1">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] px-5 py-4 rounded-[24px] text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-[#0F3D3E] text-white rounded-br-lg'
                          : 'bg-white/90 text-slate-700 border border-white shadow-[0_4px_20px_rgb(0,0,0,0.04)] rounded-bl-lg'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-1">
                        <User className="w-5 h-5 text-slate-600" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#2EC4B6] to-[#0F3D3E] flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-white/90 border border-white shadow-sm rounded-[24px] rounded-bl-lg px-5 py-4 flex items-center gap-2">
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-2 h-2 rounded-full bg-[#2EC4B6]" />
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} className="w-2 h-2 rounded-full bg-[#2EC4B6]" />
                    <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }} className="w-2 h-2 rounded-full bg-[#2EC4B6]" />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input Bar */}
          <div className="sticky bottom-0 pt-4 pb-2">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#0F3D3E]/10 to-[#2EC4B6]/10 rounded-[32px] blur-xl opacity-50 group-focus-within:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-white/90 backdrop-blur-2xl rounded-[32px] p-2 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white flex items-center">
                <div className="pl-5 pr-3 text-[#2EC4B6]">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your health, symptoms, or remedies..."
                  className="flex-1 bg-transparent border-none focus:outline-none text-base text-slate-800 placeholder-slate-400 py-4"
                  disabled={isTyping}
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isTyping}
                  className="bg-[#0F3D3E] hover:bg-[#1A595A] disabled:opacity-40 disabled:cursor-not-allowed text-white p-4 rounded-3xl font-medium transition-all shadow-lg shadow-[#0F3D3E]/20 mr-1"
                >
                  {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}