import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: 'Hello! 👋 I\'m MediBot, your AI health assistant. Ask me anything about symptoms, appointments, or our services!' },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsgText = input.trim();
    const userMsg = { id: Date.now(), sender: 'user', text: userMsgText };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    try {
      const res = await axiosInstance.post('/chat/ask', { message: userMsgText });
      const reply = res.data.reply;
      setMessages((prev) => [...prev, { id: Date.now() + 1, sender: 'bot', text: reply }]);
    } catch (error) {
      console.error(error);
      const fallbackReply = "I am currently unable to reach my server. Please try again later.";
      setMessages((prev) => [...prev, { id: Date.now() + 1, sender: 'bot', text: fallbackReply }]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-[4vh] right-[4vw] z-50 w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300 cursor-pointer ${isOpen
          ? 'bg-slate-700 rotate-0 shadow-slate-300/20'
          : 'bg-gradient-to-br from-primary-500 to-accent-500 shadow-primary-300/30 hover:shadow-2xl hover:scale-105'
          }`}
        id="ai-chatbot-toggle"
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <MessageSquare className="w-6 h-6 text-white" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-[13vh] right-[4vw] z-50 w-[360px] max-w-[calc(100vw-3rem)] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-accent-500 p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">MediBot AI</h3>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-300 rounded-full" />
                <span className="text-xs text-white/70">Online • Powered by AI</span>
              </div>
            </div>
            <Sparkles className="w-5 h-5 text-white/50 ml-auto" />
          </div>

          {/* Messages */}
          <div className="h-72 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-end gap-1.5 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-primary-100' : 'bg-accent-100'
                    }`}>
                    {msg.sender === 'user' ? <User className="w-3 h-3 text-primary-600" /> : <Bot className="w-3 h-3 text-accent-600" />}
                  </div>
                  <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.sender === 'user'
                    ? 'bg-primary-600 text-white rounded-br-md'
                    : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-bl-md'
                    }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex items-end gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-accent-100 flex items-center justify-center">
                  <Bot className="w-3 h-3 text-accent-600" />
                </div>
                <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Buttons */}
          <div className="px-4 py-2 flex gap-1.5 overflow-x-auto border-t border-slate-100 bg-white">
            {['Headache', 'Book Appointment', 'Find Doctor'].map((q) => (
              <button
                key={q}
                onClick={() => { setInput(q); }}
                className="px-3 py-1 bg-slate-100 text-slate-500 text-xs rounded-full whitespace-nowrap hover:bg-primary-50 hover:text-primary-600 transition-colors cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about symptoms, appointments..."
              className="flex-1 px-4 py-2.5 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all"
              id="chatbot-input"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 cursor-pointer"
              id="chatbot-send"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
