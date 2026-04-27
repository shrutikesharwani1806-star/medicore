import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserCheck, Calendar, DollarSign, TrendingUp, Activity, Stethoscope,
  CheckCircle, XCircle, Clock, ArrowUpRight, BarChart3, Heart, Shield
} from 'lucide-react';
import {
  AreaChart, Area, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell
} from 'recharts';
import StatCard from '../../components/ui/StatCard';
import useAppointmentStore from '../../store/useAppointmentStore';
import useDoctorStore from '../../store/useDoctorStore';

import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { SkeletonCard } from '../../components/ui/Skeleton';
import toast from 'react-hot-toast';
import axiosInstance from '../../api/axiosInstance';

const COLORS = ['#2563eb', '#0d9488', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { appointments } = useAppointmentStore();
  const { doctors, pendingDoctors, approveDoctor, rejectDoctor, fetchAdminDoctors } = useDoctorStore();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axiosInstance.get('/admin/analytics');
        setAnalytics(response.data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
        // No fallback to mock data - use empty defaults
        setAnalytics({ totalUsers: 0, totalDoctors: 0, totalAppointments: 0, totalRevenue: 0, appointmentsPerMonth: [], revenuePerMonth: [], pendingAppointments: 0, completedAppointments: 0 });
      }
    };

    fetchAnalytics();
    fetchAdminDoctors();

    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);

    const timer = setTimeout(() => setLoading(false), 800);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const stats = analytics ? [
    { title: 'Total Users', value: analytics.totalUsers, icon: Users, color: 'primary', trend: 14, onClick: () => navigate('/admin/users') },
    { title: 'Active Doctors', value: analytics.totalDoctors, icon: UserCheck, color: 'accent', trend: 8, onClick: () => navigate('/admin/users?role=doctor') },
    { title: 'Appointments', value: analytics.totalAppointments, icon: Calendar, color: 'amber', trend: 22, onClick: () => navigate('/admin/appointments') },
    { title: 'Admin Earnings', value: `₹${analytics.totalAdminEarnings || 0}`, icon: DollarSign, color: 'purple', trend: 18, onClick: () => navigate('/admin/credits') },
  ] : [
    { title: 'Total Users', value: 0, icon: Users, color: 'primary', trend: 0, onClick: () => navigate('/admin/users') },
    { title: 'Active Doctors', value: doctors.length, icon: UserCheck, color: 'accent', trend: 0, onClick: () => navigate('/admin/users?role=doctor') },
    { title: 'Appointments', value: 0, icon: Calendar, color: 'amber', trend: 0, onClick: () => navigate('/admin/appointments') },
    { title: 'Admin Earnings', value: '₹0', icon: DollarSign, color: 'purple', trend: 0, onClick: () => navigate('/admin/credits') },
  ];

  // Recent activity from recent appointments in database
  const [recentAppointments, setRecentAppointments] = useState([]);

  useEffect(() => {
    axiosInstance.get('/admin/apointments')
      .then(res => setRecentAppointments((res.data || []).slice(0, 5)))
      .catch(() => { });
  }, []);

  const getActivityIcon = (status) => {
    if (status === 'confirmed') return { icon: CheckCircle, color: 'bg-green-50 text-green-600' };
    if (status === 'pending') return { icon: Clock, color: 'bg-amber-50 text-amber-600' };
    if (status === 'completed') return { icon: CheckCircle, color: 'bg-primary-50 text-primary-600' };
    return { icon: XCircle, color: 'bg-red-50 text-red-600' };
  };

  const handleApprove = async (id, name) => { await approveDoctor(id); toast.success(`${name} approved!`); };
  const handleReject = async (id, name) => { await rejectDoctor(id); toast.error(`${name} rejected`); };

  return (
    <div className="space-y-6">
      {/* Header with 3D depth */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-primary-800 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden animate-slide-up-3d">
        {/* 3D decorations */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary-500/10 rounded-full -translate-y-1/2 translate-x-1/3 animate-morph-bg" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-500/10 rounded-full translate-y-1/2 -translate-x-1/4 animate-breathe" />
        {/* Floating icons */}
        <div className="absolute top-6 right-8 opacity-15 animate-float">
          <Shield className="w-14 h-14" />
        </div>
        <div className="absolute bottom-4 right-24 opacity-10 animate-float" style={{ animationDelay: '2.5s' }}>
          <Heart className="w-8 h-8" />
        </div>
        <div className="absolute top-1/2 right-48 opacity-10 animate-float" style={{ animationDelay: '4s' }}>
          <Stethoscope className="w-10 h-10" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Stethoscope className="w-5 h-5 text-primary-300" />
            <p className="text-slate-300 text-sm font-medium">Admin Control Panel</p>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">System Overview 🏥</h1>
          <p className="text-slate-400 text-sm mt-2">
            {pendingDoctors.length} pending approvals • {appointments.filter(a => a.status === 'pending').length} pending appointments
          </p>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div key={i} style={{ animationDelay: `${i * 80}ms` }}>
              <StatCard {...stat} />
            </div>
          ))}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Appointments Trend */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100/80 p-5 animate-slide-up-3d hover:shadow-lg hover:border-primary-100/60 transition-all duration-500" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Appointments Trend</h3>
            <div className="flex items-center gap-1 text-green-500 text-xs font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> +22%
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={analytics?.appointmentsPerMonth || []}>
              <defs>
                <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} fill="url(#fill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100/80 p-5 animate-slide-up-3d hover:shadow-lg hover:border-accent-100/60 transition-all duration-500" style={{ animationDelay: '280ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Revenue Overview</h3>
            <div className="flex items-center gap-1 text-green-500 text-xs font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> +18%
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics?.revenuePerMonth || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }} formatter={(v) => [`₹${v}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#0d9488" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pending Approvals */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100/80 p-5 animate-slide-up-3d hover:shadow-lg transition-all duration-500" style={{ animationDelay: '340ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Doctor Approval Requests</h3>
            <span className="px-2.5 py-0.5 bg-amber-50 text-amber-600 rounded-full text-xs font-medium animate-pulse-soft">
              {pendingDoctors.length} pending
            </span>
          </div>
          {pendingDoctors.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No pending requests</p>
          ) : (
            <div className="space-y-3">
              {pendingDoctors.slice(0, 4).map((doc, i) => (
                <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50/80 transition-all duration-300 border border-slate-50 hover:border-slate-100 hover:shadow-sm animate-slide-up-3d group" style={{ animationDelay: `${400 + i * 60}ms` }}>
                  <img src={doc.image} alt={doc.name} className="w-10 h-10 rounded-xl bg-slate-100 group-hover:scale-105 transition-transform duration-300" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700">{doc.name}</p>
                    <p className="text-xs text-slate-400">{doc.specialization} • {doc.experience} yrs exp</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(doc.id, doc.name)} className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all duration-300 cursor-pointer hover:scale-110 hover:shadow-md active:scale-95" title="Approve">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleReject(doc.id, doc.name)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all duration-300 cursor-pointer hover:scale-110 hover:shadow-md active:scale-95" title="Reject">
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100/80 p-5 animate-slide-up-3d hover:shadow-lg transition-all duration-500" style={{ animationDelay: '400ms' }}>
          <h3 className="font-semibold text-slate-800 mb-4">Recent Appointments</h3>
          <div className="space-y-3">
            {recentAppointments.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No recent activity</p>
            ) : recentAppointments.map((apt, i) => {
              const { icon: Icon, color } = getActivityIcon(apt.status);
              return (
                <div key={apt._id} className="flex items-start gap-3 hover:translate-x-1 transition-transform duration-300 group" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-600 leading-tight">
                      {apt.patientId?.name || 'Patient'} → {apt.doctorId?.name || 'Doctor'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{apt.status} • {new Date(apt.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
