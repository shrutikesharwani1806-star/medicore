import { Pill } from 'lucide-react';

export default function ChatBubble({ message, isOwn }) {
  const sender = typeof message.senderId === 'object' ? message.senderId : null;
  const avatarUrl = sender?.image || `https://api.dicebear.com/9.x/avataaars/svg?seed=${sender?.name || 'User'}`;

  // Detect prescription messages
  const isPrescription = message.text?.startsWith('💊 **PRESCRIPTION**');
  // Detect report messages
  const isReport = message.text?.startsWith('📋 Shared a medical report:');

  const renderPrescriptionContent = (text) => {
    const lines = text.split('\n').filter(l => l.trim());
    return (
      <div className={`space-y-1.5 ${isOwn ? 'text-white' : 'text-slate-700'}`}>
        <div className="flex items-center gap-1.5 mb-2">
          <Pill className="w-4 h-4" />
          <span className="font-bold text-sm">Prescription</span>
        </div>
        {lines.slice(1).map((line, i) => {
          const trimmed = line.trim();
          if (trimmed.startsWith('🩺') || trimmed.startsWith('📋') || trimmed.startsWith('📝')) {
            return <p key={i} className="text-xs font-semibold mt-1">{trimmed}</p>;
          }
          if (/^\d+\./.test(trimmed)) {
            return (
              <div key={i} className={`text-xs px-2 py-1 rounded-lg ${isOwn ? 'bg-white/10' : 'bg-slate-50 border border-slate-100'}`}>
                {trimmed}
              </div>
            );
          }
          return trimmed ? <p key={i} className="text-xs">{trimmed}</p> : null;
        })}
      </div>
    );
  };

  return (
    <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'} mb-4 animate-slide-up`}>
      {/* Avatar Icon */}
      <div className="flex-shrink-0 mb-1">
        <img
          src={avatarUrl}
          alt=""
          className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white shadow-sm"
        />
      </div>

      {/* Message Content */}
      <div
        className={`
          max-w-[75%] rounded-2xl px-4 py-2.5
          ${isPrescription
            ? (isOwn
              ? 'bg-gradient-to-br from-green-500 to-green-600 text-white rounded-br-none'
              : 'bg-gradient-to-br from-green-50 to-emerald-50 text-slate-700 border border-green-200 shadow-sm rounded-bl-none')
            : isReport
              ? (isOwn
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-none'
                : 'bg-gradient-to-br from-blue-50 to-sky-50 text-slate-700 border border-blue-200 shadow-sm rounded-bl-none')
              : (isOwn
                ? 'bg-primary-600 text-white rounded-br-none'
                : 'bg-white text-slate-700 border border-slate-100 shadow-sm rounded-bl-none')
          }
        `}
      >
        {isPrescription ? (
          renderPrescriptionContent(message.text)
        ) : (
          <p className="text-sm leading-relaxed">{message.text}</p>
        )}

        {message.fileUrl && (
          <div className="mt-2 pt-2 border-t border-white/10">
            {message.fileUrl.match(/\.(jpeg|jpg|gif|png)$/) ? (
              <img src={message.fileUrl} alt="Shared" className="max-w-full rounded-lg mb-1 border border-white/20" />
            ) : (
              <a
                href={message.fileUrl}
                target="_blank"
                rel="noreferrer"
                className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium transition-colors ${isOwn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-50 hover:bg-slate-100 text-primary-600'}`}
              >
                <div className={`p-1.5 rounded-lg ${isOwn ? 'bg-white/20' : 'bg-primary-50'}`}>
                  📄
                </div>
                <div className="flex-1 truncate">
                  {message.fileUrl.split('/').pop()}
                </div>
              </a>
            )}
          </div>
        )}

        <p className={`text-[10px] mt-1 ${isOwn ? (isPrescription ? 'text-green-200' : isReport ? 'text-blue-200' : 'text-primary-200') : 'text-slate-400'} text-right`}>
          {message.time || (message.createdAt && new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}
        </p>
      </div>
    </div>
  );
}
