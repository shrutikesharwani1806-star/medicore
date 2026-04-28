import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Send, Paperclip, Phone, Video, MoreVertical, Pill, Plus, Trash2, FileText, Upload } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import toast from 'react-hot-toast';
import axiosInstance from '../../api/axiosInstance';
import ChatBubble from '../../components/cards/ChatBubble';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import socket from '../../socket';

export default function DoctorChatPage() {
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
  const reportInputRef = useRef(null);

  // Prescription modal state
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [rxSending, setRxSending] = useState(false);
  const [rxDiagnosis, setRxDiagnosis] = useState('');
  const [rxInstructions, setRxInstructions] = useState('');
  const [rxMedicines, setRxMedicines] = useState([
    { id: 1, medicine: '', dosage: '', frequency: 'Once daily', duration: '7 days' }
  ]);

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
          // Fetch the user details to add to list
          const userRes = await axiosInstance.get(`/doctor/patient/${initialUserId}`);
          setActiveUser(userRes.data.profile);
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
      fetchConversations();
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

  // Report upload handler
  const handleReportUpload = async (e) => {
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
        text: `📋 Shared a medical report: ${file.name}`,
        fileUrl: uploadRes.data.fileUrl
      });

      const newMsg = res.data;
      setMessages([...messages, newMsg]);

      const roomId = [user._id, activeUser._id].sort().join('_');
      socket.emit("send_message", { ...newMsg, room: roomId });
      toast.success('Report shared!');
      fetchConversations();
    } catch (error) {
      toast.error('Failed to upload report');
    } finally {
      setUploading(false);
      if (reportInputRef.current) reportInputRef.current.value = '';
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await axiosInstance.delete(`/messages/${msgId}`);
      setMessages(messages.filter(m => m._id !== msgId));
      toast.success('Message deleted');
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const handleDeleteConversation = async () => {
    if (!activeUser) return;
    if (!window.confirm(`Are you sure you want to delete the entire conversation with ${activeUser.name}?`)) return;

    try {
      const roomId = [user._id, activeUser._id].sort().join('_');
      await axiosInstance.delete(`/messages/conversations/${roomId}`);
      setMessages([]);
      toast.success('Conversation deleted');
      fetchConversations();
    } catch (error) {
      toast.error('Failed to delete conversation');
    }
  };

  // Prescription helpers
  const addMedicine = () => {
    setRxMedicines([...rxMedicines, { id: Date.now(), medicine: '', dosage: '', frequency: 'Once daily', duration: '7 days' }]);
  };

  const removeMedicine = (id) => {
    if (rxMedicines.length === 1) return;
    setRxMedicines(rxMedicines.filter(m => m.id !== id));
  };

  const updateMedicine = (id, field, value) => {
    setRxMedicines(rxMedicines.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const resetPrescriptionForm = () => {
    setRxDiagnosis('');
    setRxInstructions('');
    setRxMedicines([{ id: 1, medicine: '', dosage: '', frequency: 'Once daily', duration: '7 days' }]);
  };

  const handleSharePrescription = async () => {
    if (!activeUser) return;
    const validMeds = rxMedicines.filter(m => m.medicine.trim());
    if (validMeds.length === 0) {
      toast.error('Add at least one medicine');
      return;
    }

    setRxSending(true);

    // Build a formatted prescription text for the chat message
    let rxText = `💊 **PRESCRIPTION**\n`;
    if (rxDiagnosis.trim()) rxText += `🩺 Diagnosis: ${rxDiagnosis}\n`;
    rxText += `\n📋 Medicines:\n`;
    validMeds.forEach((m, i) => {
      rxText += `${i + 1}. ${m.medicine} — ${m.dosage || 'N/A'} | ${m.frequency} | ${m.duration}\n`;
    });
    if (rxInstructions.trim()) rxText += `\n📝 Instructions: ${rxInstructions}`;

    try {
      const res = await axiosInstance.post('/messages/send', {
        receiverId: activeUser._id,
        text: rxText.trim()
      });

      const newMsg = res.data;
      setMessages([...messages, newMsg]);

      const roomId = [user._id, activeUser._id].sort().join('_');
      socket.emit("send_message", { ...newMsg, room: roomId });

      toast.success('Prescription shared!');
      fetchConversations();
      setShowPrescriptionModal(false);
      resetPrescriptionForm();
    } catch (error) {
      toast.error('Failed to share prescription');
    } finally {
      setRxSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] animate-fade-in bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

      {/* Sidebar for conversations */}
      <div className="w-1/3 border-r border-slate-100 flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-bold text-slate-800">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="text-center py-10 text-slate-400 text-sm px-4">No recent conversations. Patients can chat after booking confirmed.</p>
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
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {conv.otherUser?._id === user?._id ? 'You' : conv.otherUser?.name}
                  </p>
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
                  <h3 className="font-semibold text-slate-800 text-sm">
                    {activeUser._id === user?._id ? 'You' : activeUser.name}
                  </h3>
                  <p className="text-xs text-green-500">Patient</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={Pill}
                  onClick={() => setShowPrescriptionModal(true)}
                  className="rounded-xl border-green-200 text-green-600 hover:bg-green-50"
                >
                  Prescription
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Video}
                  disabled={activeUser._id === user?._id}
                  onClick={() => {
                    const ids = [user._id, activeUser._id].sort();
                    navigate(`/video-call/chat-${ids[0]}-${ids[1]}`);
                  }}
                  className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Video Call
                </Button>
                <button
                  onClick={handleDeleteConversation}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  title="Delete entire chat"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {messages.map((msg) => (
                <ChatBubble
                  key={msg._id}
                  message={msg}
                  isOwn={(msg.senderId?._id || msg.senderId) === user?._id}
                  onDelete={handleDeleteMessage}
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
              <input
                type="file"
                className="hidden"
                ref={reportInputRef}
                onChange={handleReportUpload}
                accept=".pdf,.jpg,.jpeg,.png"
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current.click()}
                className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                title="Attach file"
              >
                <Paperclip className={`w-5 h-5 ${uploading ? 'animate-spin' : ''}`} />
              </button>
              <button
                type="button"
                disabled={uploading}
                onClick={() => reportInputRef.current.click()}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                title="Share report"
              >
                <FileText className={`w-5 h-5 ${uploading ? 'animate-spin' : ''}`} />
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

      {/* Prescription Modal */}
      <Modal
        isOpen={showPrescriptionModal}
        onClose={() => { setShowPrescriptionModal(false); resetPrescriptionForm(); }}
        title="Share Prescription"
        size="lg"
      >
        <div className="space-y-4">
          {/* Patient Info (read-only) */}
          <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
            <img
              src={activeUser?.image || `https://api.dicebear.com/9.x/avataaars/svg?seed=${activeUser?.name}`}
              alt=""
              className="w-10 h-10 rounded-xl bg-slate-200"
            />
            <div>
              <p className="text-sm font-semibold text-slate-800">{activeUser?.name}</p>
              <p className="text-xs text-slate-500">Patient</p>
            </div>
          </div>

          {/* Diagnosis */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Diagnosis</label>
            <input
              type="text"
              value={rxDiagnosis}
              onChange={(e) => setRxDiagnosis(e.target.value)}
              placeholder="e.g., Upper Respiratory Infection"
              className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all"
            />
          </div>

          {/* Medicines */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                <Pill className="w-3.5 h-3.5 text-green-500" /> Medicines *
              </label>
              <button
                type="button"
                onClick={addMedicine}
                className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Medicine
              </button>
            </div>

            {rxMedicines.map((med, i) => (
              <div key={med.id} className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-slate-400">Medicine #{i + 1}</span>
                  {rxMedicines.length > 1 && (
                    <button onClick={() => removeMedicine(med.id)} className="text-red-400 hover:text-red-600 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={med.medicine}
                    onChange={(e) => updateMedicine(med.id, 'medicine', e.target.value)}
                    placeholder="Medicine name *"
                    className="px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                  <input
                    type="text"
                    value={med.dosage}
                    onChange={(e) => updateMedicine(med.id, 'dosage', e.target.value)}
                    placeholder="Dosage (e.g., 500mg)"
                    className="px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                  <select
                    value={med.frequency}
                    onChange={(e) => updateMedicine(med.id, 'frequency', e.target.value)}
                    className="px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-200"
                  >
                    <option>Once daily</option>
                    <option>Twice daily</option>
                    <option>Three times daily</option>
                    <option>As needed</option>
                  </select>
                  <select
                    value={med.duration}
                    onChange={(e) => updateMedicine(med.id, 'duration', e.target.value)}
                    className="px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-200"
                  >
                    <option>3 days</option>
                    <option>5 days</option>
                    <option>7 days</option>
                    <option>10 days</option>
                    <option>14 days</option>
                    <option>30 days</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Additional Instructions</label>
            <textarea
              value={rxInstructions}
              onChange={(e) => setRxInstructions(e.target.value)}
              placeholder="e.g., Take after meals, avoid cold water..."
              rows={2}
              className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              size="md"
              className="flex-1"
              onClick={() => { setShowPrescriptionModal(false); resetPrescriptionForm(); }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={Send}
              loading={rxSending}
              className="flex-1"
              onClick={handleSharePrescription}
            >
              Share in Chat
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
