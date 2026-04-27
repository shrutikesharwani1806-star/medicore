import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart, Legend,
} from 'recharts';
import { analyticsData } from '../../data/mockData';
import { SkeletonCard } from '../../components/ui/Skeleton';
import axiosInstance from '../../api/axiosInstance';

const COLORS = ['#2563eb', '#0d9488', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(analyticsData);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axiosInstance.get('/admin/analytics');
        if (res.data) {
          setData({
            appointmentsPerMonth: res.data.appointmentsPerMonth || analyticsData.appointmentsPerMonth,
            revenuePerMonth: res.data.revenuePerMonth || analyticsData.revenuePerMonth,
            usersByRole: res.data.usersByRole || analyticsData.usersByRole,
            specialtyDistribution: res.data.specialtyDistribution || analyticsData.specialtyDistribution,
          });
        }
      } catch (error) {
        console.error('Failed to fetch analytics, using fallback:', error);
      }
      setLoading(false);
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Analytics</h1>
          <p className="text-sm text-slate-500">Platform insights and statistics</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <SkeletonCard />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Analytics</h1>
        <p className="text-sm text-slate-500">Platform insights and statistics</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {/* Appointments Trend */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 animate-slide-up">
          <h3 className="font-semibold text-slate-800 mb-4">Appointments Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data.appointmentsPerMonth}>
              <defs>
                <linearGradient id="colorAppt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  fontSize: 12,
                }}
              />
              <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} fill="url(#colorAppt)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 animate-slide-up" style={{ animationDelay: '80ms' }}>
          <h3 className="font-semibold text-slate-800 mb-4">Revenue Overview</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.revenuePerMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  fontSize: 12,
                }}
                formatter={(value) => [`$${value}`, 'Revenue']}
              />
              <Bar dataKey="revenue" fill="#0d9488" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Users by Role */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 animate-slide-up" style={{ animationDelay: '160ms' }}>
          <h3 className="font-semibold text-slate-800 mb-4">Users by Role</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.usersByRole}
                dataKey="count"
                nameKey="role"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                label={({ role, percent }) => `${role} (${(percent * 100).toFixed(0)}%)`}
              >
                {data.usersByRole.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Specialty Distribution */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 animate-slide-up" style={{ animationDelay: '240ms' }}>
          <h3 className="font-semibold text-slate-800 mb-4">Specialty Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.specialtyDistribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" width={80} />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  fontSize: 12,
                }}
              />
              <Bar dataKey="value" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
