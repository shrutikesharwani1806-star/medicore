import { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import axiosInstance from '../../api/axiosInstance';

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await axiosInstance.get('/admin/apointments');
        setAppointments(res.data || []);
      } catch (error) {
        console.error('Failed to fetch admin appointments', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  return (
    <div className="space-y-6">
      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">All Appointments</h1>
        <p className="text-sm text-slate-500">View all platform appointments</p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400 text-center py-10">Loading appointments...</p>
      ) : appointments.length === 0 ? (
        <EmptyState icon={Calendar} title="No appointments yet" description="Appointments will appear here once booked." />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left text-xs font-medium text-slate-400 px-5 py-3">Patient</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-5 py-3">Doctor</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-5 py-3">Date & Time</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-5 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-5 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => (
                  <tr key={apt._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img src={apt.patientId?.image || `https://api.dicebear.com/9.x/avataaars/svg?seed=${apt.patientId?.name}`} alt="Patient" className="w-8 h-8 rounded-full bg-slate-100" />
                        <span className="text-sm font-medium text-slate-700">{apt.patientId?.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img src={apt.doctorId?.image || `https://api.dicebear.com/9.x/avataaars/svg?seed=${apt.doctorId?.name}`} alt="Doctor" className="w-8 h-8 rounded-full bg-slate-100" />
                        <span className="text-sm font-medium text-slate-700">{apt.doctorId?.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> {apt.date}
                        <Clock className="w-3.5 h-3.5 text-slate-400 ml-2" /> {apt.slot}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge status={apt.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm font-medium text-slate-700">
                      ₹{apt.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
