import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Clock, Users, Award, MapPin, Calendar, ArrowLeft, Shield, CheckCircle, XCircle, TrendingUp, DollarSign, Activity } from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';

export default function AdminDoctorDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [doctor, setDoctor] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [docRes, statsRes] = await Promise.all([
                    axiosInstance.get(`/doctor/public/${id}`),
                    axiosInstance.get(`/admin/doctor-stats/${id}`)
                ]);
                setDoctor(docRes.data);
                setStats(statsRes.data);
            } catch (error) {
                console.error('Error fetching doctor details:', error);
                toast.error('Failed to load doctor details');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleApprove = async () => {
        try {
            await axiosInstance.put(`/admin/approve-doctor/${id}`);
            setDoctor({ ...doctor, approved: true });
            toast.success('Doctor approved successfully');
        } catch (error) {
            toast.error('Approval failed');
        }
    };

    const handleBlockToggle = async () => {
        try {
            const res = await axiosInstance.put(`/admin/users/${doctor.userId?._id || doctor._id}`, {
                isBlocked: !doctor.isBlocked
            });
            setDoctor({ ...doctor, isBlocked: !doctor.isBlocked });
            toast.success(doctor.isBlocked ? 'Doctor unblocked' : 'Doctor blocked');
        } catch (error) {
            toast.error('Failed to update block status');
        }
    };

    if (loading) return <div className="p-10 text-center animate-pulse">Loading doctor profile...</div>;
    if (!doctor) return <div className="p-10 text-center">Doctor not found</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-primary-600 transition-all">
                <ArrowLeft className="w-4 h-4" /> Back to List
            </button>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Column: Profile Card */}
                <div className="lg:w-1/3 space-y-6">
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-slide-up">
                        <div className="h-24 bg-gradient-to-r from-slate-800 to-slate-700" />
                        <div className="px-6 pb-6 text-center -mt-12">
                            <img
                                src={doctor.image}
                                alt={doctor.name}
                                className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg bg-white mx-auto"
                            />
                            <h1 className="text-xl font-bold text-slate-800 mt-4">{doctor.name}</h1>
                            <p className="text-sm text-primary-600 font-medium">{doctor.specialization}</p>
                            <div className="mt-3 flex justify-center gap-2">
                                <Badge status={doctor.approved ? 'active' : 'pending'}>
                                    {doctor.approved ? 'Approved' : 'Pending Approval'}
                                </Badge>
                                {doctor.isBlocked && <Badge status="rejected">Blocked</Badge>}
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-6">
                                <div className="p-3 bg-slate-50 rounded-xl">
                                    <p className="text-xs text-slate-400">Experience</p>
                                    <p className="font-bold text-slate-800">{doctor.experience} yrs</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl">
                                    <p className="text-xs text-slate-400">Rating</p>
                                    <p className="font-bold text-amber-600 flex items-center justify-center gap-1">
                                        <Star className="w-3.5 h-3.5 fill-amber-400" /> {doctor.rating}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 space-y-2">
                                {!doctor.approved && (
                                    <Button className="w-full" variant="success" icon={CheckCircle} onClick={handleApprove}>
                                        Approve Doctor
                                    </Button>
                                )}
                                <Button
                                    className="w-full"
                                    variant={doctor.isBlocked ? "outline" : "danger"}
                                    icon={Shield}
                                    onClick={handleBlockToggle}
                                >
                                    {doctor.isBlocked ? 'Unblock Doctor' : 'Block Doctor'}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-slide-up" style={{ animationDelay: '100ms' }}>
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary-500" />
                            Contact Information
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Email</span>
                                <span className="text-slate-700 font-medium">{doctor.email}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Phone</span>
                                <span className="text-slate-700 font-medium">{doctor.phone || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Education</span>
                                <span className="text-slate-700 font-medium text-right">{doctor.education}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Stats and Charts */}
                <div className="lg:w-2/3 space-y-6">
                    <div className="grid sm:grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: '150ms' }}>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center mb-3">
                                <Users className="w-5 h-5 text-primary-600" />
                            </div>
                            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total Patients</p>
                            <p className="text-2xl font-black text-slate-800">{stats?.totalPatients || 0}</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-3">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total Bookings</p>
                            <p className="text-2xl font-black text-slate-800">{stats?.totalBookings || 0}</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-3">
                                <DollarSign className="w-5 h-5 text-amber-600" />
                            </div>
                            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total Earnings</p>
                            <p className="text-2xl font-black text-slate-800">₹{stats?.totalEarnings || 0}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-slide-up" style={{ animationDelay: '200ms' }}>
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary-500" />
                            Clinic Details
                        </h3>
                        <p className="text-sm text-slate-600 mb-4">{doctor.about}</p>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Address</p>
                            <p className="text-sm text-slate-700">{doctor.address || 'No clinic address provided'}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-slide-up" style={{ animationDelay: '250ms' }}>
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-500" />
                            Availability
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                <span key={day} className={`px-3 py-1 rounded-lg text-xs font-medium ${doctor.availableDays?.includes(day) ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-300'}`}>
                                    {day}
                                </span>
                            ))}
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                            {doctor.availableSlots?.map(slot => (
                                <span key={slot} className="px-2 py-1.5 bg-slate-50 rounded-lg text-[10px] font-bold text-slate-600 text-center border border-slate-100">
                                    {slot}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
