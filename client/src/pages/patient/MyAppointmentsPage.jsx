import { useState, useEffect } from 'react';
import { Calendar, Clock, AlertTriangle, Video, Star, FileText, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAppointmentStore from '../../store/useAppointmentStore';
import useAuthStore from '../../store/useAuthStore';
import axiosInstance from '../../api/axiosInstance';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

export default function MyAppointmentsPage() {
  const navigate = useNavigate();
  const { appointments, cancelAppointment, fetchPatientAppointments, loading, payOnlineFee } = useAppointmentStore();
  const { updateCredits } = useAuthStore();
  const [tab, setTab] = useState('upcoming');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [prescriptionApt, setPrescriptionApt] = useState(null);
  const [prescriptionData, setPrescriptionData] = useState(null);
  const [payingFee, setPayingFee] = useState(null);

  useEffect(() => {
    fetchPatientAppointments();
  }, []);

  const myAppts = appointments;
  const upcoming = myAppts.filter((a) => a.status === 'confirmed' || a.status === 'pending');
  const past = myAppts.filter((a) => a.status === 'completed' || a.status === 'cancelled' || a.status === 'rejected');
  const current = tab === 'upcoming' ? upcoming : past;

  const handleConfirmCancel = async () => {
    if (cancelTarget) {
      try {
        await cancelAppointment(cancelTarget.id);
        toast.success('Appointment cancelled');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to cancel');
      }
      setCancelTarget(null);
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    if (!comment.trim()) {
      toast.error('Please write a comment');
      return;
    }
    try {
      await import('../../api/axiosInstance').then(m => m.default.post(`/reviews/${reviewTarget.doctorId}`, {
        rating,
        comment
      }));
      toast.success('Review submitted successfully!');
      setReviewTarget(null);
      setRating(0);
      setComment('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    }
  };

  const handleViewPrescription = async (apt) => {
    try {
      const res = await axiosInstance.get(`/appointment/${apt.id}`);
      // Wait, prescriptions are fetched differently? Let's check if the prescription API is needed or if it's attached.
      // Usually, prescriptions are fetched from /prescriptions/patient/:id but let's just fetch it
      const presRes = await axiosInstance.get(`/prescriptions/patient/${apt.patientId}`);
      const relatedPrescription = presRes.data.find(p => p.appointmentId === apt.id);

      setPrescriptionData(relatedPrescription);
      setPrescriptionApt(apt);
    } catch (error) {
      toast.error('Failed to load prescription');
    }
  };

  const handlePayFee = async (apt) => {
    setPayingFee(apt.id);
    try {
      const res = await useAppointmentStore.getState().payConsultationFee(apt.id);
      if (res.creditsRemaining !== undefined) {
        updateCredits(res.creditsRemaining);
      }
      toast.success('Payment successful! Thank you.');
      fetchPatientAppointments(); // Refresh to update status/flags
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed');
    } finally {
      setPayingFee(null);
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'pending': return { icon: '⏳', text: 'Waiting for doctor approval', color: 'text-amber-600 bg-amber-50' };
      case 'confirmed': return { icon: '✅', text: 'Approved by doctor', color: 'text-green-600 bg-green-50' };
      case 'completed': return { icon: '🏥', text: 'Visit completed', color: 'text-blue-600 bg-blue-50' };
      case 'cancelled': return { icon: '❌', text: 'Cancelled', color: 'text-red-600 bg-red-50' };
      case 'rejected': return { icon: '🚫', text: 'Rejected by doctor', color: 'text-red-600 bg-red-50' };
      default: return { icon: '📋', text: status, color: 'text-slate-600 bg-slate-50' };
    }
  };

  return (
    <div className="space-y-6">
      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">My Appointments</h1>
        <p className="text-sm text-slate-500">Track your appointment requests, approvals, and history</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 animate-slide-up">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center cursor-pointer hover:shadow-md transition-all" onClick={() => setTab('upcoming')}>
          <p className="text-2xl font-bold text-amber-600">{myAppts.filter(a => a.status === 'pending').length}</p>
          <p className="text-xs font-medium text-amber-600">Pending</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center cursor-pointer hover:shadow-md transition-all" onClick={() => setTab('upcoming')}>
          <p className="text-2xl font-bold text-green-600">{myAppts.filter(a => a.status === 'confirmed').length}</p>
          <p className="text-xs font-medium text-green-600">Confirmed</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center cursor-pointer hover:shadow-md transition-all" onClick={() => setTab('past')}>
          <p className="text-2xl font-bold text-blue-600">{myAppts.filter(a => a.status === 'completed').length}</p>
          <p className="text-xs font-medium text-blue-600">Completed</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-100 w-fit animate-slide-up">
        {['upcoming', 'past'].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer capitalize ${tab === t ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t} ({t === 'upcoming' ? upcoming.length : past.length})
          </button>
        ))}
      </div>

      {/* List */}
      {current.length === 0 ? (
        <EmptyState icon={Calendar} title={`No ${tab} appointments`} description={tab === 'upcoming' ? 'Book an appointment with a doctor to get started' : 'Your completed appointments will appear here'} />
      ) : (
        <div className="space-y-4">
          {current.map((apt, i) => {
            const statusInfo = getStatusMessage(apt.status);
            return (
              <div key={apt.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-all animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <img src={apt.doctorImage} alt={apt.doctorName} className="w-14 h-14 rounded-xl bg-slate-100 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="font-semibold text-slate-800">{apt.doctorName}</h4>
                        <p className="text-sm text-primary-500">{apt.specialization}</p>
                      </div>
                      <Badge status={apt.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mb-3">
                      <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg">
                        <Calendar className="w-3.5 h-3.5 text-primary-500" />
                        <span>{apt.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg">
                        <Clock className="w-3.5 h-3.5 text-primary-500" />
                        <span>{apt.time}</span>
                      </div>
                      {apt.type && (
                        <span className="px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg text-xs font-medium">{apt.type}</span>
                      )}
                    </div>
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${statusInfo.color}`}>
                      <span>{statusInfo.icon}</span>
                      <span>{statusInfo.text}</span>
                    </div>
                  </div>
                </div>
                {(apt.status === 'pending' || apt.status === 'confirmed') && (
                  <div className="mt-4 pt-3 border-t border-slate-50 flex gap-2">
                    <Button variant="danger" size="sm" onClick={() => setCancelTarget(apt)}>
                      Cancel Appointment
                    </Button>
                    {apt.status === 'confirmed' && (
                      <div className="flex gap-2 w-full">
                        <Button variant="primary" size="sm" className="flex-1" icon={Video} onClick={() => navigate(`/video-call/${apt.id}`)}>
                          Join Video Call
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" icon={FileText} onClick={() => navigate(`/patient/chat?userId=${apt.doctorId}`)}>
                          Chat with Doctor
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                {apt.status === 'completed' && (
                  <div className="mt-4 pt-3 border-t border-slate-50 flex gap-2 flex-wrap">
                    {!apt.isPaid && (
                      <Button variant="primary" size="sm" icon={CreditCard} loading={payingFee === apt.id} onClick={() => handlePayFee(apt)}>
                        Pay ₹{apt.amount} to Doctor
                      </Button>
                    )}

                    <Button variant="outline" size="sm" icon={Star} onClick={() => setReviewTarget(apt)}>
                      Rate Doctor
                    </Button>

                    {apt.isPaid && (
                      <Button variant="outline" size="sm" icon={FileText} onClick={() => handleViewPrescription(apt)}>
                        View Prescription
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <Modal isOpen={!!cancelTarget} onClose={() => setCancelTarget(null)} title="">
        <div className="text-center p-2">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Cancel Appointment?</h3>
          {cancelTarget && (
            <p className="text-sm text-slate-500 mb-1">
              Appointment with <strong>{cancelTarget.doctorName}</strong> on {cancelTarget.date} at {cancelTarget.time}
            </p>
          )}
          <p className="text-sm text-slate-400 mb-6">This action cannot be undone. Are you sure you want to cancel?</p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setCancelTarget(null)}>Keep Appointment</Button>
            <Button variant="danger" className="flex-1" onClick={handleConfirmCancel}>Yes, Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Review Modal */}
      <Modal isOpen={!!reviewTarget} onClose={() => { setReviewTarget(null); setRating(0); setComment(''); }} title="Rate Your Doctor">
        <div className="p-2 space-y-4">
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-slate-800">How was your visit?</h3>
            {reviewTarget && (
              <p className="text-sm text-slate-500">Dr. {reviewTarget.doctorName}</p>
            )}
          </div>

          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-8 h-8 cursor-pointer transition-colors ${rating >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`}
                onClick={() => setRating(star)}
              />
            ))}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600 mb-1 block">Your Review</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience..."
              rows={4}
              className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 resize-none"
            />
          </div>

          <Button className="w-full mt-4" onClick={handleSubmitReview}>
            Submit Review
          </Button>
        </div>
      </Modal>

      {/* Prescription Modal */}
      <Modal isOpen={!!prescriptionApt} onClose={() => { setPrescriptionApt(null); setPrescriptionData(null); }} title="Prescription">
        <div className="p-4 bg-slate-50 rounded-xl space-y-4 max-h-[70vh] overflow-y-auto">
          {prescriptionApt && (
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-800">Dr. {prescriptionApt.doctorName}</h3>
                <p className="text-sm text-slate-500">{prescriptionApt.date}</p>
              </div>
              <Badge status={prescriptionApt.status} />
            </div>
          )}

          {prescriptionData ? (
            <div className="space-y-4">
              {prescriptionData.medicines && prescriptionData.medicines.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-700 mb-2">Medicines</h4>
                  <div className="space-y-2">
                    {prescriptionData.medicines.map((med, i) => (
                      <div key={i} className="bg-white p-3 rounded-lg border border-slate-100 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-slate-800 text-sm">{med.name}</p>
                          <p className="text-xs text-slate-500">{med.dosage} • {med.frequency} • {med.duration}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {prescriptionData.instructions && (
                <div>
                  <h4 className="font-semibold text-slate-700 mb-2">Instructions</h4>
                  <p className="text-sm text-slate-600 bg-white p-3 rounded-lg border border-slate-100">{prescriptionData.instructions}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No prescription details available for this appointment yet.</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
