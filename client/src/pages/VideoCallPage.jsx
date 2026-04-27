import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { JitsiMeeting } from '@jitsi/react-sdk';
import useAuthStore from '../store/useAuthStore';
import { ArrowLeft } from 'lucide-react';

export default function VideoCallPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  if (!roomId) {
    return <div className="p-10 text-center">Invalid Meeting Room</div>;
  }

  return (
    <div className="h-screen w-full flex flex-col bg-slate-900 text-white">
      <div className="p-4 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg">MediCore Consultation</h1>
        </div>
        <div className="text-sm text-slate-400">
          Room: {roomId}
        </div>
      </div>

      <div className="flex-1 w-full bg-black">
        <JitsiMeeting
          domain="meet.jit.si"
          roomName={`medicore-consultation-${roomId}`}
          configOverwrite={{
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            disableModeratorIndicator: true,
          }}
          interfaceConfigOverwrite={{
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
          }}
          userInfo={{
            displayName: user?.name || 'Guest',
            email: user?.email || '',
          }}
          onApiReady={(externalApi) => {
            // Can attach event listeners here
          }}
          getIFrameRef={(iframeRef) => {
            iframeRef.style.height = '100%';
            iframeRef.style.width = '100%';
          }}
        />
      </div>
    </div>
  );
}
