import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, Phone, Mail, MapPin, Video, MessageSquare, ArrowLeft, CheckCircle, FileText, Pill, CreditCard, Star } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import axiosInstance from '../../api/axiosInstance';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';

export default function AppointmentDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [appointment, setAppointment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);

    useEffect(() => {
        const fetchAppointment = async () => {
            try {
                const res = await axiosInstance.get(`/appointment/${id}`);
                setAppointment(res.data);

                // Check if user has already reviewed this doctor
                if (user.role === 'patient') {
                    const reviewRes = await axiosInstance.get(`/reviews/${res.data.doctorId._id || res.data.doctorId}`);
                    const existing = reviewRes.data.find(r => r.patientId?._id === user._id || r.patientId === user._id);
                    if (existing) setHasReviewed(true);
                }
            } catch (error) {
                toast.error('Failed to fetch appointment details');
                navigate(-1);
            } finally {
                setLoading(false);
            }
        };
        fetchAppointment();
    }, [id, user._id, user.role]);

    if (loading) return <div className="p-10 text-center animate-pulse">Loading appointment details...</div>;
    if (!appointment) return <div className="p-10 text-center">Appointment not found</div>;

    const isDoctor = user.role === 'doctor';
    const otherUser = isDoctor ? appointment.patientId : appointment.doctorId;

    const handleComplete = async (paymentMethod = 'credits') => {
        try {
            await axiosInstance.put(`/appointment/status/${id}`, {
                status: 'completed',
                paymentMethod
            });
            toast.success(`Appointment marked as completed via ${paymentMethod}`);
            setAppointment({ ...appointment, status: 'completed', isPaid: paymentMethod === 'cash' });
        } catch (error) {
            toast.error('Failed to complete appointment');
        }
    };

    const handleReview = async (e) => {
        e.preventDefault();
        if (rating === 0) return toast.error('Please select a rating');
        if (!comment.trim()) return toast.error('Please enter a comment');

        setSubmittingReview(true);
        try {
            await axiosInstance.post('/reviews', {
                doctorId: appointment.doctorId._id || appointment.doctorId,
                rating,
                comment
            });
            toast.success('Thank you for your feedback!');
            setHasReviewed(true);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit review');
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleAction = async (action) => {
        if (action === 'completed') {
            // We'll handle this separately with a custom UI/prompt
            return;
        }
        try {
            await axiosInstance.put(`/appointment/status/${id}`, { status: action });
            toast.success(`Appointment ${action} successfully`);
            setAppointment({ ...appointment, status: action });
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-primary-600 transition-all">
                <ArrowLeft className="w-4 h-4" /> Back to List
            </button>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-slide-up">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-primary-600 to-indigo-600 p-8 text-white">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Badge status={appointment.status} className="bg-white/20 text-white border-white/20 capitalize" />
                                <span className="text-primary-100 text-sm">{appointment.type} Appointment</span>
                            </div>
                            <h1 className="text-3xl font-bold">Appointment #{appointment._id.slice(-6).toUpperCase()}</h1>
                            <p className="text-primary-100 mt-1">Booked on {new Date(appointment.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2">
                            {appointment.status === 'confirmed' && (
                                <>
                                    <Button variant="secondary" icon={Video} onClick={() => navigate(`/video-call/${appointment._id}`)}>
                                        Join Video
                                    </Button>
                                    <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20" icon={MessageSquare} onClick={() => navigate(`/${user.role}/chat?userId=${otherUser?._id}`)}>
                                        Chat Now
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-8 grid md:grid-cols-2 gap-8">
                    {/* User Info */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <User className="w-5 h-5 text-primary-500" />
                            {isDoctor ? 'Patient Details' : 'Doctor Details'}
                        </h2>
                        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <img
                                src={otherUser?.image || `https://api.dicebear.com/9.x/avataaars/svg?seed=${otherUser?.name}`}
                                alt={otherUser?.name}
                                className="w-16 h-16 rounded-2xl bg-white shadow-sm"
                            />
                            <div>
                                <h3 className="font-bold text-slate-800">{otherUser?.name}</h3>
                                <p className="text-sm text-slate-500">{isDoctor ? 'Patient' : otherUser?.category || 'Specialist'}</p>
                                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {otherUser?.phone || 'N/A'}</span>
                                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {otherUser?.email}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4">
                            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Schedule</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <Calendar className="w-5 h-5 text-primary-500 mb-2" />
                                    <p className="text-xs text-slate-400">Date</p>
                                    <p className="font-bold text-slate-800">{appointment.date}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <Clock className="w-5 h-5 text-indigo-500 mb-2" />
                                    <p className="text-xs text-slate-400">Time Slot</p>
                                    <p className="font-bold text-slate-800">{appointment.slot}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Additional Details */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary-500" />
                            Consultation Info
                        </h2>

                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-xs text-slate-400 mb-1 font-semibold uppercase">Reason for visit</p>
                                <p className="text-slate-700">{appointment.reason || 'No reason provided'}</p>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-xs text-slate-400 mb-1 font-semibold uppercase">Financial Details</p>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-sm text-slate-600 flex items-center gap-1.5"><CreditCard className="w-4 h-4" /> Consultation Fee</span>
                                    <span className="font-bold text-slate-800">₹{appointment.amount}</span>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-sm text-slate-600 flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> Payment Status</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${appointment.isPaid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {appointment.isPaid ? 'PAID' : 'PENDING'}
                                    </span>
                                </div>
                            </div>

                            {/* Prescription Button (Only if completed) */}
                            {appointment.status === 'completed' && (
                                <Button
                                    variant="outline"
                                    className="w-full py-4 border-dashed border-2 hover:bg-slate-50"
                                    icon={Pill}
                                    onClick={() => navigate(isDoctor ? '/doctor/prescriptions' : '/patient/reports')}
                                >
                                    {isDoctor ? 'View / Edit Prescription' : 'View Prescription'}
                                </Button>
                            )}
                        </div>

                        {/* Status Management Actions */}
                        {isDoctor && (appointment.status === 'pending' || appointment.status === 'confirmed') && (
                            <div className="pt-6 border-t border-slate-100">
                                <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider">Update Status</h3>
                                {appointment.status === 'pending' && (
                                    <div className="flex gap-3">
                                        <Button variant="success" className="flex-1" onClick={() => handleAction('confirmed')}>Approve</Button>
                                        <Button variant="danger" className="flex-1" onClick={() => handleAction('rejected')}>Reject</Button>
                                    </div>
                                )}
                                {appointment.status === 'confirmed' && (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button variant="primary" className="flex-1" onClick={() => handleComplete('credits')}>
                                                Complete (Pay via Credits)
                                            </Button>
                                            <Button variant="success" className="flex-1" onClick={() => handleComplete('cash')}>
                                                Complete (Paid via Cash)
                                            </Button>
                                        </div>
                                        <Button variant="danger" className="w-full" onClick={() => handleAction('cancelled')}>Cancel</Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Patient Review Section */}
            {!isDoctor && (appointment.status === 'confirmed' || appointment.status === 'completed') && !hasReviewed && (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
                    <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                        Rate your experience
                    </h2>
                    <p className="text-sm text-slate-500 mb-6">How was your consultation with Dr. {appointment.doctorId?.name}?</p>

                    <form onSubmit={handleReview} className="space-y-6">
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className="p-1 hover:scale-110 transition-transform"
                                >
                                    <Star className={`w-8 h-8 ${rating >= star ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`} />
                                </button>
                            ))}
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Your Feedback</label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                rows={4}
                                placeholder="Share your thoughts about the consultation..."
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all resize-none"
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={submittingReview}
                            className="w-full sm:w-auto px-10"
                        >
                            {submittingReview ? 'Submitting...' : 'Post Review'}
                        </Button>
                    </form>
                </div>
            )}

            {hasReviewed && !isDoctor && (
                <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center animate-slide-up">
                    <p className="text-sm font-medium text-green-700 flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        You have already shared your feedback for this consultation.
                    </p>
                </div>
            )}
        </div>
    );
}

