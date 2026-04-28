import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Calendar, Clock, TrendingUp, Stethoscope, Heart, Activity, Pill, DollarSign, FileText, AlertTriangle } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import useDoctorStore from '../../store/useDoctorStore';
import useAppointmentStore from '../../store/useAppointmentStore';
import usePaymentStore from '../../store/usePaymentStore';
import DoctorCard from '../../components/cards/DoctorCard';
import StatCard from '../../components/ui/StatCard';
import { specializations, iconMap } from '../../data/mockData';
import { SkeletonCard } from '../../components/ui/Skeleton';
import axiosInstance from '../../api/axiosInstance';

export default function PatientDashboard() {
  const { user } = useAuthStore();
  const { doctors } = useDoctorStore();
  const { appointments } = useAppointmentStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const { fetchPublicDoctors } = useDoctorStore();
  const { fetchPatientAppointments } = useAppointmentStore();
  const { paymentRequests, fetchPaymentRequests } = usePaymentStore();
  const [reportCount, setReportCount] = useState(0);

  useEffect(() => {
    fetchPublicDoctors();
    if (user) {
      fetchPatientAppointments();
      fetchPaymentRequests();
      // Fetch report count
      axiosInstance.get('/report/user').then(res => setReportCount(res.data?.length || 0)).catch(() => { });
    }
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const myAppointments = appointments;
  const upcoming = myAppointments.filter((a) => a.status === 'confirmed' || a.status === 'pending');
  const popularDoctors = doctors.filter((d) => d.approved).slice(0, 4);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/patient/find-doctor?q=${encodeURIComponent(search)}`);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner with 3D depth */}
      <div className="relative bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 rounded-3xl p-6 sm:p-8 text-white overflow-hidden animate-slide-up-3d">
        {/* 3D depth layers */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 animate-morph-bg" />
        <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 animate-breathe" />
        {/* Floating medical icons */}
        <div className="absolute top-4 right-8 opacity-20 animate-float">
          <Stethoscope className="w-12 h-12" />
        </div>
        <div className="absolute bottom-4 right-24 opacity-15 animate-float" style={{ animationDelay: '2s' }}>
          <Heart className="w-8 h-8" />
        </div>
        <div className="absolute top-12 right-32 opacity-10 animate-float" style={{ animationDelay: '4s' }}>
          <Activity className="w-10 h-10" />
        </div>
        <div className="relative z-10">
          <p className="text-primary-100 text-sm mb-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Hello, {user?.name?.split(' ')[0] || 'there'}! 👋
          </h1>
          <p className="text-primary-100 text-sm mb-5 max-w-md">
            Find the best doctors, book appointments, and take care of your health — all in one place.
          </p>
          <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search doctors, specializations..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-slate-700 bg-white/95 backdrop-blur
                  focus:outline-none focus:ring-2 focus:ring-white/50 placeholder:text-slate-400 transition-all duration-300 focus:shadow-lg"
                id="dashboard-search"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-300 backdrop-blur cursor-pointer hover:scale-105 active:scale-95"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      {/* Demo Mode Banner for Pending Doctors */}
      {user?.role === 'doctor' && !user?.isActive && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 animate-pulse-subtle shadow-sm">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-amber-800 text-sm">Demo Mode</h3>
            <p className="text-xs text-amber-600 mt-0.5">Your doctor account is pending approval. You are currently viewing the platform in demo mode.</p>
          </div>
        </div>
      )}

      {/* Pending Payment Warning */}
      {paymentRequests.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse-subtle shadow-sm">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-red-800 text-sm">Payment Required</h3>
              <p className="text-xs text-red-600 mt-0.5">You have {paymentRequests.length} pending consultation fees. Please pay them to unlock new bookings.</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/patient/payment-requests')}
            className="px-5 py-2.5 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-all shadow-md shadow-red-200 cursor-pointer whitespace-nowrap"
          >
            Pay Now
          </button>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Upcoming" value={upcoming.length} icon={Calendar} color="primary" subtitle="appointments" onClick={() => navigate('/patient/appointments')} />
        <StatCard title="Doctors" value={doctors.length} icon={TrendingUp} color="accent" subtitle="available" onClick={() => navigate('/patient/find-doctor')} />
        <StatCard title="Payments" value={paymentRequests.length} icon={DollarSign} color={paymentRequests.length > 0 ? "red" : "green"} subtitle="pending" onClick={() => navigate('/patient/payment-requests')} />
        <StatCard title="Completed" value={myAppointments.filter(a => a.status === 'completed').length} icon={Clock} color="amber" subtitle="visits" onClick={() => navigate('/patient/appointments')} />
        <StatCard title="Reports" value={reportCount} icon={FileText} color="purple" subtitle="uploaded" onClick={() => navigate('/patient/reports')} />
      </div>

      {/* Specializations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Specializations</h2>
          <button
            onClick={() => navigate('/patient/find-doctor')}
            className="text-sm text-primary-600 font-medium hover:underline cursor-pointer hover:text-primary-700 transition-colors"
          >
            View All
          </button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-3">
          {specializations.map((spec, i) => {
            const IconComp = iconMap[spec.icon];
            return (
              <button
                key={spec.id}
                onClick={() => navigate(`/patient/find-doctor?spec=${spec.name}`)}
                className={`
                  flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-500
                  hover:shadow-lg hover:-translate-y-2 cursor-pointer
                  ${spec.bg} group animate-slide-up-3d
                `}
                style={{ animationDelay: `${i * 50}ms` }}
                id={`spec-${spec.name.toLowerCase()}`}
              >
                <div className={`p-2 rounded-xl bg-white/80 ${spec.color} group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 group-hover:shadow-md`}>
                  {IconComp && <IconComp className="w-5 h-5" />}
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-slate-600 text-center leading-tight">
                  {spec.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Popular Doctors */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Popular Doctors</h2>
          <button
            onClick={() => navigate('/patient/find-doctor')}
            className="text-sm text-primary-600 font-medium hover:underline cursor-pointer hover:text-primary-700 transition-colors"
          >
            See All
          </button>
        </div>
        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {popularDoctors.map((doc) => (
              <DoctorCard key={doc.id} doctor={doc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
