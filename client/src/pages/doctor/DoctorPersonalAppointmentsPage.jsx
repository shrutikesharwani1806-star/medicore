import { useState, useEffect } from 'react';
import { Calendar, Clock, ArrowLeft, Heart, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import axiosInstance from '../../api/axiosInstance';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

export default function DoctorPersonalAppointmentsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchPersonalAppointments = async () => {
    try {
      const res = await axiosInstance.get('/appointment/user');
      setAppointments(res.data || []);
    } catch (error) {
      toast.error('Failed to fetch personal appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonalAppointments();
  }, []);

  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return ['pending', 'confirmed'].includes(apt.status);
    if (filter === 'past') return ['completed', 'cancelled', 'rejected'].includes(apt.status);
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slide-up">
        <div>
          <button
            onClick={() => navigate('/doctor')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-primary-600 transition-colors mb-2 uppercase tracking-wider"
          >
            <ArrowLeft className="w-3 h-3" /> Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Heart className="w-6 h-6 text-accent-500" /> My Personal Appointments
          </h1>
          <p className="text-sm text-slate-500">View and manage appointments you've booked as a patient</p>
        </div>

        <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-100">
          {['all', 'upcoming', 'past'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${filter === f ? 'bg-accent-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-slate-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredAppointments.length === 0 ? (
        <EmptyState 
          icon={Calendar} 
          title="No appointments found" 
          description={filter === 'all' ? "You haven't booked any personal appointments yet." : `No ${filter} appointments found.`}
          action={
            <Button onClick={() => navigate('/patient/find-doctor')} variant="primary">
              Book an Appointment
            </Button>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filteredAppointments.map((apt, i) => (
            <div 
              key={apt._id} 
              className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 hover:shadow-xl hover:border-accent-100 transition-all duration-300 group animate-slide-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="relative">
                  <img
                    src={apt.doctorId?.image || `https://api.dicebear.com/9.x/avataaars/svg?seed=${apt.doctorId?.name}`}
                    alt={apt.doctorId?.name}
                    className="w-16 h-16 rounded-2xl bg-slate-100 object-cover border-2 border-white shadow-sm"
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                    <Heart className="w-3 h-3 text-white fill-white" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-800 group-hover:text-primary-600 transition-colors">Dr. {apt.doctorId?.name}</h3>
                      <p className="text-xs font-medium text-accent-600">{apt.doctorId?.category || 'Specialist'}</p>
                    </div>
                    <Badge status={apt.status} />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded-lg text-[10px] font-bold text-slate-500">
                      <Calendar className="w-3 h-3" /> {apt.date}
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded-lg text-[10px] font-bold text-slate-500">
                      <Clock className="w-3 h-3" /> {apt.slot}
                    </div>
                    <div className="px-2 py-1 bg-primary-50 rounded-lg text-[10px] font-bold text-primary-600 uppercase">
                      {apt.type}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="text-xs">
                  <span className="text-slate-400">Fee: </span>
                  <span className="font-bold text-slate-700">₹{apt.amount}</span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 text-[10px] px-3"
                    onClick={() => navigate(`/appointment/${apt._id}`)}
                  >
                    View Details
                  </Button>
                  {apt.status === 'confirmed' && (
                    <Button 
                      size="sm" 
                      variant="primary" 
                      className="h-8 text-[10px] px-3"
                      onClick={() => navigate(`/video-call/${apt._id}`)}
                    >
                      Join Call
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
