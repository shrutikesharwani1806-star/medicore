import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Send, Paperclip, Phone, Video, MoreVertical } from 'lucide-react';
import { io } from 'socket.io-client';
import useAuthStore from '../../store/useAuthStore';
import toast from 'react-hot-toast';
import axiosInstance from '../../api/axiosInstance';
import ChatBubble from '../../components/cards/ChatBubble';
import Button from '../../components/ui/Button';


const socket = io("http://localhost:5000");

export default function ChatPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialUserId = searchParams.get('userId');

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const { user } = useAuthStore();
  const bottomRef = useRef(null);
  const [conversations, setConversations] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await axiosInstance.get('/messages/conversations/list');
      setConversations(res.data);

      if (initialUserId) {
        const found = res.data.find(c => c.otherUser?._id === initialUserId);
        if (found) {
          setActiveUser(found.otherUser);
        } else {
          // Fetch the doctor/user details to add to list if not found in recent conversations
          const userRes = await axiosInstance.get(`/doctor/public/${initialUserId}`);
          setActiveUser(userRes.data);
        }
      } else if (res.data.length > 0) {
        setActiveUser(res.data[0].otherUser);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (activeUser) {
      fetchMessages();
      const roomId = [user._id, activeUser._id].sort().join('_');
      socket.emit("join_room", roomId);
    }
  }, [activeUser]);

  const fetchMessages = async () => {
    if (!activeUser) return;
    try {
      const res = await axiosInstance.get(`/messages/${activeUser._id}`);
      setMessages(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    socket.on("receive_message", (data) => {
      if (data.senderId !== user?._id) {
        setMessages((prev) => [...prev, data]);
        // Simple notification
        if (activeUser?._id !== data.senderId) {
          toast(`New message from ${data.senderId?.name || 'someone'}`, { icon: '💬' });
          fetchConversations(); // update last message in sidebar
        }
      }
    });

    return () => {
      socket.off("receive_message");
    };
  }, [user, activeUser]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeUser) return;

    try {
      const res = await axiosInstance.post('/messages/send', {
        receiverId: activeUser._id,
        text: input.trim()
      });

      const newMsg = res.data;
      setMessages([...messages, newMsg]);
      setInput('');

      const roomId = [user._id, activeUser._id].sort().join('_');
      socket.emit("send_message", { ...newMsg, room: roomId });
      fetchConversations(); // Refresh sidebar to show last message
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeUser) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('chatFile', file);

    try {
      const uploadRes = await axiosInstance.post('/messages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const res = await axiosInstance.post('/messages/send', {
        receiverId: activeUser._id,
        text: `Shared a file: ${file.name}`,
        fileUrl: uploadRes.data.fileUrl
      });

      const newMsg = res.data;
      setMessages([...messages, newMsg]);

      const roomId = [user._id, activeUser._id].sort().join('_');
      socket.emit("send_message", { ...newMsg, room: roomId });
      toast.success('File sent!');
      fetchConversations();
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] animate-fade-in bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

      {/* Sidebar for conversations */}
      <div className="hidden sm:flex w-1/3 border-r border-slate-100 flex-col">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-bold text-slate-800">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="text-center py-10 text-slate-400 text-sm px-4">No recent conversations. Book an appointment to start chatting!</p>
          ) : conversations.map(conv => (
            <div
              key={conv.otherUser?._id}
              onClick={() => setActiveUser(conv.otherUser)}
              className={`p-4 border-b border-slate-50 cursor-pointer flex gap-3 items-center hover:bg-slate-50 transition-colors ${activeUser?._id === conv.otherUser?._id ? 'bg-primary-50 border-r-4 border-r-primary-500' : ''}`}
            >
              <div className="relative">
                <img src={conv.otherUser?.image || `https://api.dicebear.com/9.x/avataaars/svg?seed=${conv.otherUser?.name}`} alt="" className="w-11 h-11 rounded-xl object-cover bg-slate-200 shadow-sm" />
                {conv.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                  <p className="text-sm font-bold text-slate-800 truncate">{conv.otherUser?.name}</p>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-primary-600 font-bold' : 'text-slate-500'}`}>
                  {conv.lastMessage || 'No messages'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50/50">
        {activeUser ? (
          <>
            <div className="bg-white border-b border-slate-100 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={activeUser.image || `https://api.dicebear.com/9.x/avataaars/svg?seed=${activeUser.name}`}
                  alt=""
                  className="w-10 h-10 rounded-xl bg-slate-100"
                />
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">{activeUser.name}</h3>
                  <p className="text-xs text-primary-500">Doctor</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={Video}
                onClick={() => {
                  const ids = [user._id, activeUser._id].sort();
                  navigate(`/video-call/chat-${ids[0]}-${ids[1]}`);
                }}
                className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Video Call
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {messages.map((msg) => (
                <ChatBubble
                  key={msg._id}
                  message={msg}
                  isOwn={(msg.senderId?._id || msg.senderId) === user?._id}
                />
              ))}
              <div ref={bottomRef} />
            </div>

            <form
              onSubmit={handleSend}
              className="bg-white border-t border-slate-100 px-4 py-3 flex items-center gap-3"
            >
              <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current.click()}
                className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
              >
                <Paperclip className={`w-5 h-5 ${uploading ? 'animate-spin' : ''}`} />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="p-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-slate-400 text-sm">Select a conversation to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}
