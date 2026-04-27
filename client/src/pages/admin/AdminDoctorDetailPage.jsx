import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Award, Clock, MapPin, CreditCard, Calendar, Activity, Shield, Star, Coins } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';

export default function AdminDoctorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await axiosInstance.get(`/admin/users/${id}/details`);
        setDoctor(res.data.user);
        setAppointments(res.data.appointments || []);
      } catch (err) {
        toast.error('Failed to load doctor details');
        navigate('/admin/doctor-approval');
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!doctor) return null;

  const completedAppts = appointments.filter(a => a.status === 'completed').length;
  const totalRevenue = appointments.reduce((sum, a) => sum + (a.amount || 0), 0);
  const uniquePatients = new Set(appointments.map(a => a.patientId?._id || a.patientId)).size;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 transition-colors cursor-pointer">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Doctor Header Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-slide-up">
        <div className="h-32 bg-gradient-to-r from-accent-500 to-primary-500 relative" />
        <div className="px-6 pb-6 -mt-14">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <img
              src={doctor.image || `https://api.dicebear.com/9.x/avataaars/svg?seed=${doctor.name}&backgroundColor=b6e3f4`}
              alt={doctor.name}
              className="w-28 h-28 rounded-3xl border-4 border-white shadow-lg bg-white object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-800">{doctor.name}</h1>
                <Badge status={doctor.isActive ? 'confirmed' : 'pending'}>
                  {doctor.isActive ? 'Active' : 'Pending Approval'}
                </Badge>
                {doctor.subscriptionStatus === 'paid' && (
                  <span className="px-2 py-0.5 bg-green-50 text-green-600 text-xs font-bold rounded-full">✅ Subscribed</span>
                )}
                {doctor.subscriptionStatus !== 'paid' && doctor.isActive && (
                  <span className="px-2 py-0.5 bg-red-50 text-red-600 text-xs font-bold rounded-full">❌ No Subscription</span>
                )}
              </div>
              <p className="text-accent-600 font-medium mt-1">{doctor.category || 'General Medicine'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
          <Calendar className="w-5 h-5 text-primary-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-800">{appointments.length}</p>
          <p className="text-xs text-slate-500">Total Appointments</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
          <Activity className="w-5 h-5 text-green-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-800">{completedAppts}</p>
          <p className="text-xs text-slate-500">Completed</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
          <User className="w-5 h-5 text-accent-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-800">{uniquePatients}</p>
          <p className="text-xs text-slate-500">Unique Patients</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
          <CreditCard className="w-5 h-5 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-slate-800">₹{totalRevenue}</p>
          <p className="text-xs text-slate-500">Total Revenue</p>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid sm:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: '150ms' }}>
        {/* Personal Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Personal Information</h3>
          <div className="space-y-3">
            {[
              { icon: Mail, label: 'Email', value: doctor.email },
              { icon: Phone, label: 'Phone', value: doctor.phone },
              { icon: Award, label: 'Specialization', value: doctor.category || 'Not set' },
              { icon: Clock, label: 'Experience', value: doctor.experience ? `${doctor.experience} years` : 'Not set' },
              { icon: MapPin, label: 'Address', value: doctor.address || 'Not set' },
              { icon: Star, label: 'Rating', value: doctor.averageRating ? `${doctor.averageRating} ★ (${doctor.totalRatings} reviews)` : 'No ratings' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                  <Icon className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="text-sm font-medium text-slate-700">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Financial Details</h3>
          <div className="space-y-3">
            {[
              { icon: Coins, label: 'Credit Balance', value: `₹${doctor.credits || 0}` },
              { icon: CreditCard, label: 'Total Earnings', value: `₹${doctor.earnings || 0}` },
              { icon: CreditCard, label: 'Online Fee', value: doctor.onlineFee ? `₹${doctor.onlineFee}` : 'Not set' },
              { icon: CreditCard, label: 'Offline Fee', value: doctor.offlineFee ? `₹${doctor.offlineFee}` : 'Not set' },
              { icon: Shield, label: 'Subscription', value: doctor.subscriptionStatus === 'paid' ? 'Active (Paid)' : 'Unpaid' },
              { icon: Shield, label: 'Last Paid', value: doctor.subscriptionPaidDate ? new Date(doctor.subscriptionPaidDate).toLocaleDateString() : 'Never' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                  <Icon className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="text-sm font-medium text-slate-700">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* QR Code */}
          {doctor.qrCode && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-medium text-slate-400 mb-2">Payment QR Code</p>
              <img src={doctor.qrCode} alt="QR Code" className="w-32 h-32 rounded-xl border border-slate-200 object-cover" />
            </div>
          )}
        </div>
      </div>

      {/* Availability */}
      {doctor.availability && doctor.availability.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <h3 className="font-semibold text-slate-800 mb-4">Availability Schedule</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {doctor.availability.map((day, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-3">
                <p className="text-sm font-semibold text-slate-700 mb-2">{day.day}</p>
                <div className="flex flex-wrap gap-1">
                  {day.slots?.map((slot, j) => (
                    <span key={j} className="px-2 py-0.5 bg-primary-50 text-primary-600 text-xs font-medium rounded-lg">{slot}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Appointments */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-slide-up" style={{ animationDelay: '250ms' }}>
        <h3 className="font-semibold text-slate-800 mb-4">Recent Appointments ({appointments.length})</h3>
        {appointments.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No appointments found</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {appointments.slice(0, 20).map((apt) => (
              <div key={apt._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <img
                    src={apt.patientId?.image || `https://api.dicebear.com/9.x/avataaars/svg?seed=${apt.patientId?.name || 'P'}`}
                    alt="Patient"
                    className="w-8 h-8 rounded-lg bg-slate-200"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-700">{apt.patientId?.name || 'Patient'}</p>
                    <p className="text-xs text-slate-400">{apt.date} • {apt.slot}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge status={apt.status === 'completed' ? 'confirmed' : apt.status}>{apt.status}</Badge>
                  <p className="text-xs text-slate-400 mt-1">₹{apt.amount || 0}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
