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
    const [allReviews, setAllReviews] = useState([]);

    useEffect(() => {
        const fetchAppointment = async () => {
            try {
                const res = await axiosInstance.get(`/appointment/${id}`);
                setAppointment(res.data);

                const doctorId = res.data.doctorId._id || res.data.doctorId;
                
                // Fetch all reviews for this doctor
                const reviewRes = await axiosInstance.get(`/reviews/${doctorId}`);
                setAllReviews(reviewRes.data);

                // Check if current user has already reviewed
                const patientId = res.data.patientId._id || res.data.patientId;
                if (patientId === user._id) {
                    const existing = reviewRes.data.find(r => (r.patientId?._id || r.patientId) === user._id);
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
    }, [id, user._id]);

    if (loading) return (
        <div className="h-screen flex items-center justify-center">
            <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500">Loading appointment details...</p>
            </div>
        </div>
    );
    if (!appointment) return <div className="p-10 text-center">Appointment not found</div>;

    const isPractitioner = (appointment.doctorId._id || appointment.doctorId) === user._id;
    const otherUser = isPractitioner ? appointment.patientId : appointment.doctorId;
    const isDoctor = isPractitioner;

    // Format Day of Week
    const appointmentDate = new Date(appointment.date);
    const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' });

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
            const res = await axiosInstance.post('/reviews', {
                doctorId: appointment.doctorId._id || appointment.doctorId,
                rating,
                comment
            });
            toast.success('Thank you for your feedback!');
            setHasReviewed(true);
            setAllReviews(prev => [res.data, ...prev]);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit review');
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleAction = async (action) => {
        try {
            await axiosInstance.put(`/appointment/status/${id}`, { status: action });
            toast.success(`Appointment ${action} successfully`);
            setAppointment({ ...appointment, status: action });
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20 px-4">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-primary-600 transition-all font-medium group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
            </button>

            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-slide-up">
                {/* Header Section */}
                <div className="bg-gradient-to-br from-slate-900 via-primary-900 to-indigo-950 p-8 md:p-12 text-white relative">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <Badge status={appointment.status} className="bg-white/10 text-white border-white/20 px-4 py-1 text-xs font-bold uppercase tracking-widest backdrop-blur-md" />
                                <span className="bg-primary-500/20 text-primary-200 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-primary-500/30">
                                    {appointment.type} Consultation
                                </span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Appointment #{appointment._id.slice(-6).toUpperCase()}</h1>
                            <p className="text-primary-200/70 mt-2 font-medium flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Booked on {new Date(appointment.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3 w-full md:w-auto">
                            {(appointment.status === 'confirmed' || appointment.status === 'completed') && (
                                <>
                                    <Button 
                                        variant="secondary" 
                                        icon={Video} 
                                        className="flex-1 md:flex-none shadow-lg shadow-primary-500/20"
                                        onClick={() => navigate(`/video-call/${appointment._id}`)}
                                    >
                                        Join Consultation
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        className="flex-1 md:flex-none bg-white/5 border-white/10 text-white hover:bg-white/10 backdrop-blur-sm" 
                                        icon={MessageSquare} 
                                        onClick={() => navigate(`/chat?userId=${otherUser?._id}`)}
                                    >
                                        Message
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-8 md:p-12 grid lg:grid-cols-3 gap-12">
                    {/* Column 1: Profiles */}
                    <div className="lg:col-span-2 space-y-10">
                        <section>
                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <User className="w-4 h-4 text-primary-500" />
                                Participants
                            </h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 hover:border-primary-100 transition-all group">
                                    <img
                                        src={appointment.patientId?.image || `https://api.dicebear.com/9.x/avataaars/svg?seed=${appointment.patientId?.name}`}
                                        alt=""
                                        className="w-14 h-14 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform"
                                    />
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Patient</p>
                                        <h3 className="font-bold text-slate-800">{appointment.patientId?.name}</h3>
                                        <p className="text-xs text-slate-500">{appointment.patientId?.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 hover:border-primary-100 transition-all group">
                                    <img
                                        src={appointment.doctorId?.image || `https://api.dicebear.com/9.x/avataaars/svg?seed=${appointment.doctorId?.name}`}
                                        alt=""
                                        className="w-14 h-14 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform"
                                    />
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Doctor</p>
                                        <h3 className="font-bold text-slate-800">Dr. {appointment.doctorId?.name}</h3>
                                        <p className="text-xs text-slate-500">{appointment.doctorId?.category || 'Specialist'}</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-indigo-500" />
                                    Schedule Details
                                </h2>
                                <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:scale-110 transition-transform">
                                        <Calendar className="w-12 h-12 text-primary-500" />
                                    </div>
                                    <p className="text-[20px] font-extrabold text-slate-800 mb-1">{appointment.date}</p>
                                    <p className="text-primary-600 font-bold text-sm uppercase tracking-widest">{dayOfWeek}</p>
                                    <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                                            <Clock className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 font-medium">Arrival Time</p>
                                            <p className="font-bold text-slate-800">{appointment.slot}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-red-500" />
                                    Location
                                </h2>
                                <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 h-full relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:scale-110 transition-transform">
                                        <MapPin className="w-12 h-12 text-red-500" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Clinic/Address</p>
                                    <p className="text-slate-800 font-semibold leading-relaxed">
                                        {appointment.doctorId?.address || 'Medical Center - Online Consultation Available'}
                                    </p>
                                    <button className="mt-4 text-xs font-bold text-primary-600 flex items-center gap-1 hover:underline">
                                        <MapPin className="w-3 h-3" /> Get Directions
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Column 2: Financial & Actions */}
                    <div className="space-y-8">
                        <section>
                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-emerald-500" />
                                Payment Summary
                            </h2>
                            <div className="bg-white p-6 rounded-[1.5rem] border-2 border-slate-50 shadow-sm space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Service Fee</span>
                                    <span className="font-bold text-slate-800">₹{appointment.amount}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Booking Fee</span>
                                    <span className="font-bold text-slate-800">₹0.00</span>
                                </div>
                                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                                    <span className="font-bold text-slate-800">Total Amount</span>
                                    <span className="text-2xl font-black text-primary-600 tracking-tighter">₹{appointment.amount}</span>
                                </div>
                                <div className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold uppercase tracking-widest ${appointment.isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {appointment.isPaid ? (
                                        <><CheckCircle className="w-3.5 h-3.5" /> Payment Completed</>
                                    ) : (
                                        <><Clock className="w-3.5 h-3.5" /> Payment Pending</>
                                    )}
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-blue-500" />
                                Management
                            </h2>
                            {isDoctor && (appointment.status === 'pending' || appointment.status === 'confirmed') && (
                                <div className="grid gap-3">
                                    {appointment.status === 'pending' && (
                                        <>
                                            <Button variant="success" className="w-full py-4 rounded-xl font-bold shadow-lg shadow-emerald-500/10" onClick={() => handleAction('confirmed')}>Confirm Appointment</Button>
                                            <Button variant="danger" className="w-full py-3 rounded-xl font-bold" onClick={() => handleAction('rejected')}>Decline</Button>
                                        </>
                                    )}
                                    {appointment.status === 'confirmed' && (
                                        <>
                                            <Button variant="primary" className="w-full py-4 rounded-xl font-bold shadow-lg shadow-primary-500/10" onClick={() => handleComplete('credits')}>Mark Completed</Button>
                                            <Button variant="danger" className="w-full py-3 rounded-xl font-bold" onClick={() => handleAction('cancelled')}>Cancel Session</Button>
                                        </>
                                    )}
                                </div>
                            )}
                            {appointment.status === 'completed' && (
                                <Button
                                    variant="outline"
                                    className="w-full py-5 rounded-[1.25rem] border-2 border-dashed text-primary-600 bg-primary-50/30 hover:bg-primary-50 font-bold"
                                    icon={Pill}
                                    onClick={() => navigate(isDoctor ? '/doctor/prescriptions' : '/patient/reports')}
                                >
                                    {isDoctor ? 'Update Prescription' : 'View Prescription'}
                                </Button>
                            )}
                        </section>
                    </div>
                </div>
            </div>

            {/* Review Section */}
            <div className="grid md:grid-cols-2 gap-8 pt-6">
                {/* Submit Review */}
                {!isDoctor && (appointment.status === 'confirmed' || appointment.status === 'completed') && !hasReviewed && (
                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 md:p-10 animate-slide-up">
                        <h2 className="text-2xl font-black text-slate-800 mb-2">How was your visit?</h2>
                        <p className="text-slate-500 text-sm mb-8">Your feedback helps Dr. {appointment.doctorId?.name} and other patients.</p>
                        
                        <form onSubmit={handleReview} className="space-y-8">
                            <div className="flex gap-3 justify-center md:justify-start">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <button key={s} type="button" onClick={() => setRating(s)} className="p-1 hover:scale-125 transition-all">
                                        <Star className={`w-10 h-10 ${rating >= s ? 'text-amber-400 fill-amber-400' : 'text-slate-100'}`} />
                                    </button>
                                ))}
                            </div>
                            <textarea
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                placeholder="Tell us more about your experience..."
                                className="w-full p-6 bg-slate-50 rounded-[1.5rem] border border-slate-200 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all resize-none h-40"
                            />
                            <Button type="submit" disabled={submittingReview} className="w-full py-4 rounded-xl font-black text-lg shadow-xl shadow-primary-500/20">
                                {submittingReview ? 'Sending...' : 'Post Review'}
                            </Button>
                        </form>
                    </div>
                )}

                {/* All Reviews List */}
                <div className={`${(!isDoctor && !hasReviewed) ? '' : 'md:col-span-2'} bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 md:p-10 animate-slide-up`}>
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                        <div>
                            <h2 className="text-2xl font-black text-slate-800">Doctor's Reviews</h2>
                            <p className="text-slate-500 text-sm">{allReviews.length} Verified consultations</p>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-1 justify-end text-amber-500 mb-1">
                                <Star className="w-4 h-4 fill-amber-500" />
                                <span className="font-black text-xl">{appointment.doctorId?.averageRating || '0.0'}</span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Average Rating</p>
                        </div>
                    </div>

                    <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-slate-200">
                        {allReviews.map((rev, i) => (
                            <div key={rev._id} className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-700 text-sm">
                                            {rev.patientId?.name?.[0] || 'P'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{rev.patientId?.name || 'Anonymous Patient'}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">{new Date(rev.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <Star key={s} className={`w-3 h-3 ${rev.rating >= s ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`} />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-slate-600 text-sm leading-relaxed italic">"{rev.comment}"</p>
                            </div>
                        ))}
                        {allReviews.length === 0 && (
                            <div className="py-12 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                    <Star className="w-8 h-8 text-slate-200" />
                                </div>
                                <p className="text-slate-400 font-medium">No reviews yet for this doctor.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

