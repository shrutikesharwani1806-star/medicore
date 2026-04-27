import { Calendar, Clock, User, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export default function AppointmentCard({
  appointment,
  role = 'patient',
  onAccept,
  onReject,
  onCancel,
  onComplete,
}) {
  const isDoctor = role === 'doctor';
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/appointment/${appointment.id || appointment._id}`)}
      className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 animate-slide-up cursor-pointer group"
    >
      <div className="flex items-start gap-4">
        <img
          src={isDoctor ? appointment.patientImage : appointment.doctorImage}
          alt={isDoctor ? appointment.patientName : appointment.doctorName}
          className="w-12 h-12 rounded-xl object-cover bg-slate-100"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold text-slate-800 truncate">
                {isDoctor ? appointment.patientName : appointment.doctorName}
              </h4>
              <p className="text-sm text-slate-500">{appointment.specialization}</p>
            </div>
            <Badge status={appointment.status} />
          </div>
          <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{appointment.date}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{appointment.time}</span>
            </div>
          </div>
          {appointment.type && (
            <p className="text-xs text-slate-400 mt-1.5">{appointment.type}</p>
          )}
        </div>
      </div>

      {/* Doctor actions */}
      {isDoctor && appointment.status === 'pending' && (
        <div className="mt-4 flex gap-2">
          <Button variant="success" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); onAccept?.(appointment._id || appointment.id); }}>
            Accept
          </Button>
          <Button variant="danger" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); onReject?.(appointment._id || appointment.id); }}>
            Reject
          </Button>
        </div>
      )}
      {isDoctor && appointment.status === 'confirmed' && (
        <div className="mt-4 space-y-2">
          <div className="flex gap-2">
            <Button variant="primary" size="sm" className="flex-1" icon={Video} onClick={(e) => { e.stopPropagation(); navigate(`/video-call/${appointment._id || appointment.id}`); }}>
              Join Video
            </Button>
            <Button variant="outline" size="sm" className="flex-1" icon={User} onClick={(e) => { e.stopPropagation(); navigate(`/doctor/chat?userId=${appointment.patientId?._id || appointment.patientId}`); }}>
              Chat
            </Button>
          </div>
          <Button variant="success" size="sm" className="w-full" onClick={(e) => { e.stopPropagation(); onComplete?.(appointment._id || appointment.id); }}>
            Mark as Completed
          </Button>
        </div>
      )}

      {/* Patient actions */}
      {!isDoctor && appointment.status === 'confirmed' && (
        <div className="mt-4 flex gap-2">
          <Button variant="primary" size="sm" className="flex-1" icon={Video} onClick={(e) => { e.stopPropagation(); navigate(`/video-call/${appointment._id || appointment.id}`); }}>
            Join Video
          </Button>
          <Button variant="outline" size="sm" className="flex-1" icon={User} onClick={(e) => { e.stopPropagation(); navigate(`/patient/chat?userId=${appointment.doctorId?._id || appointment.doctorId}`); }}>
            Chat
          </Button>
        </div>
      )}
      {!isDoctor && (appointment.status === 'pending' || appointment.status === 'confirmed') && (
        <div className="mt-4">
          <Button variant="danger" size="sm" className="w-full" onClick={(e) => { e.stopPropagation(); onCancel?.(appointment._id || appointment.id); }}>
            Cancel Appointment
          </Button>
        </div>
      )}
    </div>
  );
}
