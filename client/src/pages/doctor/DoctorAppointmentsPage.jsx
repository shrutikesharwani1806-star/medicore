import { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, AlertTriangle, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAppointmentStore from '../../store/useAppointmentStore';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

export default function DoctorAppointmentsPage() {
  const navigate = useNavigate();
  const { appointments, acceptAppointment, rejectAppointment, completeAppointment, cancelAppointment, fetchDoctorAppointments } = useAppointmentStore();
  const [filter, setFilter] = useState('all');
  const [confirmModal, setConfirmModal] = useState({ open: false, type: '', id: null, name: '' });
  const [rejectionMessage, setRejectionMessage] = useState('');

  useEffect(() => {
    fetchDoctorAppointments();
  }, []);

  const myAppts = appointments;
  const filters = {
    all: myAppts,
    pending: myAppts.filter((a) => a.status === 'pending'),
    confirmed: myAppts.filter((a) => a.status === 'confirmed'),
    completed: myAppts.filter((a) => a.status === 'completed'),
    rejected: myAppts.filter((a) => a.status === 'rejected' || a.status === 'cancelled'),
  };
  const current = filters[filter] || myAppts;

  const openConfirm = (type, id, name) => { setConfirmModal({ open: true, type, id, name }); setRejectionMessage(''); };
  const closeConfirm = () => { setConfirmModal({ open: false, type: '', id: null, name: '' }); setRejectionMessage(''); };

  const handleConfirmAction = async (paymentMethod = 'credits') => {
    const { type, id, name } = confirmModal;
    try {
      if (type === 'approve') { await acceptAppointment(id); toast.success(`✅ ${name}'s appointment approved!`); }
      if (type === 'reject') {
        await rejectAppointment(id, rejectionMessage);
        toast.error(`${name}'s appointment rejected`);
      }
      if (type === 'complete') {
        await completeAppointment(id, paymentMethod);
        toast.success(`${name}'s appointment marked complete via ${paymentMethod}`);
      }
      if (type === 'cancel') { await cancelAppointment(id); toast.success(`${name}'s appointment cancelled and refunded`); }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    }
    closeConfirm();
  };

  const confirmMessages = {
    approve: { title: 'Approve Appointment?', desc: 'This will confirm the patient\'s booking and notify them.', color: 'text-green-600', icon: CheckCircle },
    reject: { title: 'Reject Appointment?', desc: 'Are you sure you want to reject this appointment? The patient will be notified.', color: 'text-red-600', icon: XCircle },
    complete: { title: 'Mark as Complete?', desc: 'Choose the payment method used for this consultation.', color: 'text-primary-600', icon: CheckCircle },
    cancel: { title: 'Cancel Appointment?', desc: 'Cancel this confirmed appointment? A full refund will be issued to the patient.', color: 'text-red-600', icon: XCircle },
  };

  return (
    <div className="space-y-6">
      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Appointment Requests</h1>
        <p className="text-sm text-slate-500">Review, approve or reject patient appointment requests</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-slide-up">
        {[
          { label: 'Pending', count: filters.pending.length, color: 'bg-amber-50 text-amber-600 border-amber-200' },
          { label: 'Confirmed', count: filters.confirmed.length, color: 'bg-green-50 text-green-600 border-green-200' },
          { label: 'Completed', count: filters.completed.length, color: 'bg-blue-50 text-blue-600 border-blue-200' },
          { label: 'Rejected', count: filters.rejected.length, color: 'bg-red-50 text-red-600 border-red-200' },
        ].map((s) => (
          <div key={s.label} className={`${s.color} border rounded-2xl p-4 text-center`}>
            <p className="text-2xl font-bold">{s.count}</p>
            <p className="text-xs font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap animate-slide-up">
        {Object.entries(filters).map(([key, arr]) => (
          <button key={key} onClick={() => setFilter(key)} className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all cursor-pointer ${filter === key ? 'bg-primary-600 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
            {key} ({arr.length})
          </button>
        ))}
      </div>

      {/* Appointment List */}
      {current.length === 0 ? (
        <EmptyState icon={Calendar} title={`No ${filter} appointments`} description="Appointment requests from patients will appear here" />
      ) : (
        <div className="space-y-4">
          {current.map((apt, i) => (
            <div key={apt.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-all animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <img src={apt.patientImage} alt={apt.patientName} className="w-12 h-12 rounded-xl bg-slate-100" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-slate-800">{apt.patientName}</h4>
                      <Badge status={apt.status} />
                    </div>
                    <p className="text-sm text-slate-500">{apt.type || 'Consultation'}</p>
                    {apt.reason && <p className="text-xs text-slate-400 mt-0.5 truncate">Reason: {apt.reason}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl">
                    <Calendar className="w-3.5 h-3.5 text-primary-500" />
                    <span className="font-medium">{apt.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-xl">
                    <Clock className="w-3.5 h-3.5 text-primary-500" />
                    <span className="font-medium">{apt.time}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {apt.status === 'pending' && (
                    <>
                      <Button variant="success" size="sm" icon={CheckCircle} onClick={() => openConfirm('approve', apt.id, apt.patientName)}>
                        Approve
                      </Button>
                      <Button variant="danger" size="sm" icon={XCircle} onClick={() => openConfirm('reject', apt.id, apt.patientName)}>
                        Reject
                      </Button>
                    </>
                  )}
                  {apt.status === 'confirmed' && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" icon={Video} onClick={() => navigate(`/video-call/${apt.id}`)}>
                        Video Call
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/chat?userId=${apt.patientId}`)}>
                        Chat
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => openConfirm('complete', apt.id, apt.patientName)}>
                        Complete
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => openConfirm('cancel', apt.id, apt.patientName)}>
                        Cancel
                      </Button>
                    </div>
                  )}
                  {(apt.status === 'completed' || apt.status === 'rejected') && (
                    <span className="text-xs text-slate-400 px-3 py-2">{apt.status === 'completed' ? '✅ Done' : '❌ Rejected'}</span>
                  )}
                </div>
              </div>

              {apt.patientPhone && (
                <div className="mt-3 pt-3 border-t border-slate-50 flex flex-wrap gap-3 text-xs text-slate-400">
                  <span>📞 {apt.patientPhone}</span>
                  {apt.patientEmail && <span>✉️ {apt.patientEmail}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal isOpen={confirmModal.open} onClose={closeConfirm} title="">
        {confirmModal.type && (() => {
          const info = confirmMessages[confirmModal.type];
          const Icon = info.icon;
          return (
            <div className="text-center p-2">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${confirmModal.type === 'reject' || confirmModal.type === 'cancel' ? 'bg-red-50' : 'bg-green-50'}`}>
                <Icon className={`w-8 h-8 ${info.color}`} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{info.title}</h3>
              <p className="text-sm text-slate-500 mb-1">Patient: <strong>{confirmModal.name}</strong></p>
              <p className="text-sm text-slate-400 mb-4">{info.desc}</p>
              {confirmModal.type === 'reject' && (
                <div className="mb-4 text-left">
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Rejection Reason</label>
                  <textarea
                    value={rejectionMessage}
                    onChange={(e) => setRejectionMessage(e.target.value)}
                    placeholder="Enter reason for rejection (optional)..."
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 transition-all resize-none"
                  />
                </div>
              )}
              {confirmModal.type === 'complete' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="primary" className="flex-1" onClick={() => handleConfirmAction('credits')}>
                      Pay via Credits
                    </Button>
                    <Button variant="success" className="flex-1" onClick={() => handleConfirmAction('cash')}>
                      Paid via Cash
                    </Button>
                  </div>
                  <Button variant="outline" className="w-full" onClick={closeConfirm}>Cancel</Button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={closeConfirm}>Cancel</Button>
                  <Button
                    variant={confirmModal.type === 'reject' || confirmModal.type === 'cancel' ? 'danger' : 'success'}
                    className="flex-1"
                    onClick={() => handleConfirmAction()}
                  >
                    {confirmModal.type === 'approve' ? 'Yes, Approve' : confirmModal.type === 'reject' ? 'Yes, Reject' : confirmModal.type === 'cancel' ? 'Yes, Cancel' : 'Yes, Complete'}
                  </Button>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
