import { useState, useRef, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Send, Paperclip, MoreVertical, FileText, Search, ArrowLeft, Pill, Check, CheckCheck, Video, Trash2, X } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import socket from '../socket';
import Button from '../components/ui/Button';

// Refined ChatBubble for WhatsApp aesthetic
function ChatBubble({ message, isOwn }) {
  const isPrescription = message.text?.startsWith('💊 **PRESCRIPTION**');
  const isReport = message.text?.startsWith('📋 Shared a medical report:');

  return (
    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} mb-4 animate-slide-up`}>
      <div
        className={`
          max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl shadow-sm relative transition-all hover:shadow-md
          ${isOwn 
            ? 'bg-gradient-to-br from-[#E2F7CB] to-[#D1F1AF] text-slate-800 rounded-tr-none border border-[#c6e9af]' 
            : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}
        `}
      >
        {isPrescription && (
          <div className="flex items-center gap-1.5 font-bold text-[11px] text-green-700 mb-1 border-b border-green-200 pb-1">
            <Pill className="w-3.5 h-3.5" /> DIGITAL PRESCRIPTION
          </div>
        )}

        {isReport && (
          <div className="flex items-center gap-1.5 font-bold text-[11px] text-primary-600 mb-1 border-b border-primary-100 pb-1">
            <FileText className="w-3.5 h-3.5" /> MEDICAL REPORT
          </div>
        )}

        <p className={`
          text-[14px] leading-relaxed whitespace-pre-wrap
          ${isPrescription ? 'font-medium text-slate-700' : ''}
        `}>
          {isPrescription ? message.text.replace('💊 **PRESCRIPTION**', '').trim() : message.text}
        </p>

        {message.fileUrl && (
          <div className="mt-2 pt-2 border-t border-black/5">
            {message.fileUrl.match(/\.(jpeg|jpg|gif|png)$/i) ? (
              <img src={message.fileUrl} alt="Shared" className="max-w-full rounded-lg shadow-sm cursor-pointer hover:opacity-95 transition-opacity" onClick={() => window.open(message.fileUrl, '_blank')} />
            ) : (
              <a href={message.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2.5 bg-black/5 rounded-xl text-[12px] hover:bg-black/10 transition-all border border-black/5">
                <FileText className="w-4.5 h-4.5 text-primary-600" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{message.fileUrl.split('/').pop()}</p>
                  <p className="text-[10px] text-slate-500 uppercase">Click to download</p>
                </div>
              </a>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-[9px] text-slate-400 font-medium uppercase">
            {new Date(message.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isOwn && (
            <div className="flex">
              {message.read ? <CheckCheck className="w-3 h-3 text-blue-500" /> : <Check className="w-3 h-3 text-slate-400" />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Prescription Modal Component
function PrescriptionModal({ isOpen, onClose, onSend }) {
  const [medicines, setMedicines] = useState([{ name: '', dosage: '', frequency: '', duration: '' }]);
  const [instructions, setInstructions] = useState('');

  const addMedicine = () => setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '' }]);
  const updateMedicine = (index, field, value) => {
    const newMeds = [...medicines];
    newMeds[index][field] = value;
    setMedicines(newMeds);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = `💊 **PRESCRIPTION**\n\n${medicines.map(m => `- ${m.name} (${m.dosage}) | ${m.frequency} | ${m.duration}`).join('\n')}\n\nInstructions: ${instructions}`;
    onSend(text);
    onClose();
    setMedicines([{ name: '', dosage: '', frequency: '', duration: '' }]);
    setInstructions('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-zoom-in">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-green-600 text-white">
          <h2 className="text-lg font-bold flex items-center gap-2"><Pill className="w-5 h-5" /> Issue Prescription</h2>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full text-white">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {medicines.map((med, idx) => (
            <div key={idx} className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-200">
              <input 
                placeholder="Medicine Name" 
                className="w-full px-3 py-1.5 rounded-lg border focus:ring-1 outline-none text-sm" 
                value={med.name} 
                onChange={e => updateMedicine(idx, 'name', e.target.value)} 
                required
              />
              <div className="grid grid-cols-3 gap-2">
                <input placeholder="Dosage" className="px-3 py-1.5 rounded-lg border text-[11px]" value={med.dosage} onChange={e => updateMedicine(idx, 'dosage', e.target.value)} />
                <input placeholder="Freq" className="px-3 py-1.5 rounded-lg border text-[11px]" value={med.frequency} onChange={e => updateMedicine(idx, 'frequency', e.target.value)} />
                <input placeholder="Dur" className="px-3 py-1.5 rounded-lg border text-[11px]" value={med.duration} onChange={e => updateMedicine(idx, 'duration', e.target.value)} />
              </div>
            </div>
          ))}
          <button type="button" onClick={addMedicine} className="text-green-600 text-sm font-semibold hover:underline">+ Add Medicine</button>
          <textarea 
            placeholder="Special Instructions" 
            className="w-full px-3 py-2 rounded-xl border focus:ring-1 outline-none h-20 text-sm"
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
          />
          <button type="submit" className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all">Send Prescription</button>
        </form>
      </div>
    </div>
  );
}

export default function UnifiedChatPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const targetUserId = searchParams.get('userId');

  const { user } = useAuthStore();
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // { conversationId, otherUser }
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const reportInputRef = useRef(null);

  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // 1. Initial Load & Global Listeners
  useEffect(() => {
    if (user?._id) {
      socket.emit('register_user', user._id);
    }

    socket.on('online_users', (users) => setOnlineUsers(users));
    socket.on('user_typing', (data) => {
      if (activeChat && data.room === activeChat.conversationId && data.userId !== user._id) {
        setIsOtherTyping(data.isTyping);
      }
    });

    return () => {
      socket.off('online_users');
      socket.off('user_typing');
    };
  }, [user?._id, activeChat?.conversationId]);

  useEffect(() => {
    const initChat = async () => {
      setLoading(true);
      console.log("Initializing chat... Target User ID:", targetUserId);
      try {
        const convRes = await axiosInstance.get('/messages/conversations/list');
        console.log("Conversations fetched:", convRes.data.length);
        setConversations(convRes.data);

        if (targetUserId) {
          console.log("Fetching/Creating conversation with:", targetUserId);
          const res = await axiosInstance.post('/messages/get-or-create', { targetUserId });
          console.log("Chat initialized:", res.data);
          setActiveChat(res.data);
          if (window.innerWidth < 640) setIsSidebarOpen(false);
        } else if (convRes.data.length > 0 && window.innerWidth >= 640) {
          setActiveChat({
            conversationId: convRes.data[0].conversationId,
            otherUser: convRes.data[0].otherUser
          });
        }
      } catch (error) {
        console.error('Chat init error:', error);
        toast.error('Failed to initialize chat: ' + (error.response?.data?.message || error.message));
      } finally {
        setLoading(false);
      }
    };
    initChat();
  }, [targetUserId]);

  // 2. Room Join & Message Fetching
  useEffect(() => {
    if (activeChat?.conversationId) {
      socket.emit('join_room', activeChat.conversationId);
      
      const fetchMsgs = async () => {
        try {
          const res = await axiosInstance.get(`/messages/${activeChat.otherUser._id}`);
          setMessages(res.data);
        } catch (error) {
          console.error('Fetch messages error:', error);
        }
      };
      fetchMsgs();
    }
  }, [activeChat?.conversationId]);

  useEffect(() => {
    const handleNewMessage = (msg) => {
      // If message is from current user, we already added it via API response
      const senderId = msg.senderId?._id || msg.senderId;
      if (senderId === user?._id) return;

      if (activeChat && (msg.conversationId === activeChat.conversationId)) {
        setMessages((prev) => {
          const exists = prev.find(m => m._id.toString() === msg._id.toString());
          if (exists) return prev;
          return [...prev, msg];
        });
      }
      refreshSidebar();
    };

    socket.on('receive_message', handleNewMessage);

    const handleMsgDeleted = ({ messageId }) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
    };
    const handleConvDeleted = ({ conversationId }) => {
      if (activeChat?.conversationId === conversationId) {
        setMessages([]);
        setActiveChat(null);
        setIsSidebarOpen(true);
      }
      refreshSidebar();
    };
    socket.on('message_deleted', handleMsgDeleted);
    socket.on('conversation_deleted', handleConvDeleted);

    return () => {
      socket.off('receive_message');
      socket.off('message_deleted');
      socket.off('conversation_deleted');
    };
  }, [activeChat?.conversationId, user?._id]);

  // 4. Scroll to Bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const refreshSidebar = async () => {
    try {
      const res = await axiosInstance.get('/messages/conversations/list');
      setConversations(res.data);
    } catch (err) {}
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await axiosInstance.delete(`/messages/${messageId}`);
      setMessages(prev => prev.filter(m => m._id !== messageId));
      toast.success('Message deleted');
      refreshSidebar();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete message');
    }
    setContextMenu(null);
  };

  const handleDeleteConversation = async (otherUserId) => {
    try {
      await axiosInstance.delete(`/messages/conversation/${otherUserId}`);
      setMessages([]);
      setActiveChat(null);
      setIsSidebarOpen(true);
      toast.success('Chat deleted');
      refreshSidebar();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete chat');
    }
    setDeleteConfirm(null);
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    
    if (activeChat) {
      socket.emit('typing', { room: activeChat.conversationId, userId: user._id, isTyping: true });
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { room: activeChat.conversationId, userId: user._id, isTyping: false });
      }, 2000);
    }
  };

  const isUserOnline = (userId) => onlineUsers.includes(userId);

  const handleSendMessage = async (val) => {
    const textToSend = typeof val === 'string' ? val : input.trim();
    if (!textToSend || !activeChat) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('typing', { room: activeChat.conversationId, userId: user._id, isTyping: false });

    try {
      const res = await axiosInstance.post('/messages/send', {
        receiverId: activeChat.otherUser._id,
        text: textToSend
      });

      const newMsg = res.data;
      setMessages((prev) => [...prev, newMsg]);
      if (typeof val !== 'string') setInput('');
      refreshSidebar();
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleFileUpload = async (e, isReport = false) => {
    const file = e.target.files[0];
    if (!file || !activeChat) return;

    const formData = new FormData();
    formData.append('chatFile', file);

    const toastId = toast.loading(isReport ? 'Uploading report...' : 'Uploading file...');
    try {
      const uploadRes = await axiosInstance.post('/messages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const res = await axiosInstance.post('/messages/send', {
        receiverId: activeChat.otherUser._id,
        text: isReport ? `📋 Shared a medical report: ${file.name}` : `Shared a file: ${file.name}`,
        fileUrl: uploadRes.data.fileUrl
      });

      setMessages((prev) => [...prev, res.data]);
      toast.success(isReport ? 'Report shared!' : 'File shared!', { id: toastId });
      refreshSidebar();
    } catch (error) {
      toast.error('Upload failed', { id: toastId });
    }
  };

  const filteredConversations = useMemo(() => {
    return conversations.filter(c => 
      c.otherUser?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery]);

  if (loading && !activeChat) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F0F2F5]">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium">Loading your chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[75vh] w-[100%] max-w-[95vw] mx-auto bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden border border-white/20 font-sans backdrop-blur-xl transition-all duration-700 ease-in-out">
      <PrescriptionModal 
        isOpen={isPrescriptionModalOpen} 
        onClose={() => setIsPrescriptionModalOpen(false)} 
        onSend={(text) => handleSendMessage(text)} 
      />

      {/* Sidebar */}
      <aside className={`
        ${isSidebarOpen ? 'flex' : 'hidden'} sm:flex
        flex-col w-full sm:w-[25vw] md:w-[22vw] lg:w-[20vw] bg-white/50 backdrop-blur-md border-r border-slate-100/50
      `}>
        {/* Sidebar Header */}
        <div className="p-3 bg-[#F0F2F5] flex items-center justify-between">
          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border border-white shadow-sm">
            <img src={user?.image || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user?.name}`} alt="Me" />
          </div>
          <div className="flex gap-4 text-slate-500">
             <div className="w-5 h-5 cursor-pointer hover:text-slate-800 transition-colors">
                <Search className="w-full h-full" />
             </div>
            <MoreVertical className="w-5 h-5 cursor-pointer hover:text-slate-800 transition-colors" />
          </div>
        </div>

        {/* Search */}
        <div className="p-2 bg-white">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
            <input
              type="text"
              placeholder="Search or start new chat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-1.5 bg-[#F0F2F5] rounded-lg text-sm focus:outline-none focus:bg-white focus:ring-1 focus:ring-primary-100 transition-all"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto bg-white scrollbar-thin scrollbar-thumb-slate-200">
          {filteredConversations.map((conv) => (
            <div
              key={conv.conversationId}
              className={`
                flex items-center gap-3 p-3 cursor-pointer hover:bg-[#F5F6F6] transition-all group/conv
                ${activeChat?.conversationId === conv.conversationId ? 'bg-[#EBEBEB]' : ''}
              `}
            >
              <div className="relative" onClick={() => {
                setActiveChat({ conversationId: conv.conversationId, otherUser: conv.otherUser });
                setIsSidebarOpen(false);
              }}>
                <img
                    src={conv.otherUser?.image || `https://api.dicebear.com/9.x/avataaars/svg?seed=${conv.otherUser?.name}`}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover border border-slate-100 shadow-sm"
                />
                {isUserOnline(conv.otherUser?._id) && (
                    <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-[#25D366] border-2 border-white rounded-full"></div>
                )}
              </div>
              <div className="flex-1 min-w-0 border-b border-slate-100 pb-3 mt-3" onClick={() => {
                setActiveChat({ conversationId: conv.conversationId, otherUser: conv.otherUser });
                setIsSidebarOpen(false);
              }}>
                <div className="flex justify-between items-start">
                  <h4 className="text-[15px] font-semibold text-slate-800 truncate">{conv.otherUser?.name}</h4>
                  <span className="text-[11px] text-slate-500">
                    {conv.lastMessageTime ? new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-0.5">
                  <p className="text-[13px] text-slate-500 truncate">{conv.lastMessage || 'Click to chat'}</p>
                  {conv.unreadCount > 0 && (
                    <span className="bg-[#25D366] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ type: 'conversation', otherUser: conv.otherUser }); }}
                className="opacity-0 group-hover/conv:opacity-100 p-1.5 hover:bg-red-50 rounded-lg transition-all"
                title="Delete chat"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          ))}
          {filteredConversations.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm italic">No chats found.</div>
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className={`
        ${!isSidebarOpen ? 'flex' : 'hidden'} sm:flex
        flex-1 flex-col bg-[#F8F9FA] relative
      `}>
        {/* Chat Background Pattern overlay */}
        {/* Chat Background Pattern overlay - subtle medical theme or clean pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat"></div>

        {activeChat ? (
          <>
            {/* Header */}
            <header className="z-10 bg-white/80 backdrop-blur-md p-4 flex items-center justify-between border-b border-slate-100 shadow-sm">
              <div className="flex items-center gap-3">
                <button onClick={() => setIsSidebarOpen(true)} className="sm:hidden p-1 mr-1 hover:bg-slate-200 rounded-full transition-colors">
                  <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div className="relative">
                    <img
                        src={activeChat.otherUser?.image || `https://api.dicebear.com/9.x/avataaars/svg?seed=${activeChat.otherUser?.name}`}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover border border-white shadow-sm"
                    />
                    {isUserOnline(activeChat.otherUser?._id) && (
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#25D366] border-2 border-white rounded-full"></div>
                    )}
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-slate-800 leading-tight">{activeChat.otherUser?.name}</h3>
                  <p className={`text-[11px] ${isOtherTyping ? 'text-[#25D366] font-bold animate-pulse' : 'text-slate-500'}`}>
                    {isOtherTyping ? 'typing...' : (isUserOnline(activeChat.otherUser?._id) ? 'online' : 'last seen recently')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/video-call/${activeChat.conversationId}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 text-white text-[12px] font-bold rounded-lg hover:bg-slate-800 transition-all shadow-sm"
                  title="Video Call"
                >
                  <Video className="w-3.5 h-3.5" /> Call
                </button>
                {user?.isDoctor && (
                  <button 
                    onClick={() => setIsPrescriptionModalOpen(true)}
                    className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-[12px] font-bold rounded-lg hover:bg-green-700 transition-all shadow-sm"
                  >
                    <Pill className="w-3.5 h-3.5" /> Prescription
                  </button>
                )}
                <button 
                  onClick={() => reportInputRef.current.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-[12px] font-bold rounded-lg hover:bg-primary-700 transition-all shadow-sm"
                >
                  <FileText className="w-3.5 h-3.5" /> Send Report
                </button>
                <div className="flex gap-4 text-slate-500 ml-2">
                  <Search className="w-5 h-5 cursor-pointer hover:text-slate-800 transition-colors" />
                  <MoreVertical className="w-5 h-5 cursor-pointer hover:text-slate-800 transition-colors" />
                </div>
              </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:px-10 z-10 space-y-1 scrollbar-thin scrollbar-thumb-slate-400/20" onClick={() => setContextMenu(null)}>
              {messages.map((msg) => {
                const isOwn = (msg.senderId?._id || msg.senderId) === user?._id;
                return (
                  <div key={msg._id} onContextMenu={(e) => { if (isOwn) { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, messageId: msg._id }); } }}>
                    <ChatBubble message={msg} isOwn={isOwn} />
                  </div>
                );
              })}
              <div ref={messagesEndRef} />

              {/* Context Menu */}
              {contextMenu && (
                <div className="fixed z-[200] bg-white rounded-xl shadow-2xl border border-slate-100 py-1 animate-scale-in" style={{ top: contextMenu.y, left: contextMenu.x }}>
                  <button onClick={() => handleDeleteMessage(contextMenu.messageId)} className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Delete Message
                  </button>
                  <button onClick={() => setContextMenu(null)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 w-full transition-colors">
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Input Area - Refined and floating-style */}
            <footer className="z-10 bg-white/80 backdrop-blur-md p-4 flex items-center gap-3 border-t border-slate-100">
              <input type="file" className="hidden" ref={fileInputRef} onChange={e => handleFileUpload(e)} />
              <input type="file" className="hidden" ref={reportInputRef} onChange={e => handleFileUpload(e, true)} />
              <div className="p-2 hover:bg-slate-200 rounded-full transition-colors cursor-pointer">
                  <Paperclip 
                    className="w-6 h-6 text-slate-500" 
                    onClick={() => fileInputRef.current.click()}
                  />
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex-1 flex items-center gap-3">
                <div className="flex-1 relative group">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={input}
                    onChange={handleTyping}
                    className="w-full pl-5 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[14px] focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] group-focus-within:border-primary-300"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="p-3.5 bg-gradient-to-br from-primary-500 to-accent-500 text-white rounded-2xl hover:shadow-lg hover:shadow-primary-500/25 transition-all disabled:opacity-50 disabled:grayscale shadow-md active:scale-95 group"
                >
                  <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </form>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-[#F8F9FA] z-10">
            <div className="w-64 h-64 mb-6 opacity-40">
                <img src="https://static.whatsapp.net/rsrc.php/v3/y6/r/wa669ae5zFs.png" alt="Select chat" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-2xl font-light text-slate-600 mb-2">WhatsApp for MediCore</h2>
            <p className="text-slate-400 text-sm max-w-md">Send and receive messages in real-time. Select a contact from the sidebar or click "Chat" on a profile to get started.</p>
            <div className="mt-8 flex items-center gap-2 text-slate-300 text-xs uppercase tracking-widest border-t border-slate-200 pt-8 w-64 justify-center">
                🛡️ End-to-end encrypted
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-zoom-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Chat?</h3>
            <p className="text-sm text-slate-500 mb-6">
              All messages with <strong>{deleteConfirm.otherUser?.name}</strong> will be permanently deleted. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-all">Cancel</button>
              <button onClick={() => handleDeleteConversation(deleteConfirm.otherUser?._id)} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
