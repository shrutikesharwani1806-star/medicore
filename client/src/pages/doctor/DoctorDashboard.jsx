import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Clock, Activity, Stethoscope, Heart, Coins, Shield, CreditCard } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import useAppointmentStore from '../../store/useAppointmentStore';
import axiosInstance from '../../api/axiosInstance';
import StatCard from '../../components/ui/StatCard';
import AppointmentCard from '../../components/cards/AppointmentCard';
import { SkeletonCard } from '../../components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function DoctorDashboard() {
  const { user, updateProfile } = useAuthStore();
  const navigate = useNavigate();
  const { appointments, acceptAppointment, rejectAppointment, completeAppointment, fetchDoctorAppointments, fetchPatientAppointments } = useAppointmentStore();
  const [loading, setLoading] = useState(true);
  const [personalAppointments, setPersonalAppointments] = useState([]);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [subStatus, setSubStatus] = useState(null); // 'paid' or 'unpaid'
  const [payingSub, setPayingSub] = useState(false);

  useEffect(() => {
    // Check if doctor has completed their profile setup
    if (!user?.profileCompleted) {
      toast('Please complete your profile setup to start accepting appointments', { icon: 'ℹ️' });
      navigate('/doctor/profile');
      return;
    }

    // Fetch subscription status
    axiosInstance.get('/payment/subscription-status')
      .then(res => {
        setSubStatus(res.data.subscriptionStatus);
        // Sync user credits/earnings from server
        updateProfile({
          credits: res.data.credits,
          earnings: res.data.earnings,
          subscriptionStatus: res.data.subscriptionStatus,
          subscriptionPaidDate: res.data.subscriptionPaidDate
        });
      })
      .catch(() => setSubStatus('unpaid'));

    // Fetch professional and personal appointments
    Promise.all([
      fetchDoctorAppointments(),
      axiosInstance.get('/appointment/user') // Fetching personal ones directly for local state
    ]).then(([_, resPersonal]) => {
      setPersonalAppointments(resPersonal.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const myAppts = appointments; // Professional
  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const todayAppts = myAppts.filter((a) => a.date === todayStr);
  const pendingAppts = myAppts.filter((a) => a.status === 'pending');
  const confirmedAppts = myAppts.filter((a) => a.status === 'confirmed');
  const uniquePatients = new Set(myAppts.map((a) => a.patientId)).size;

  // Personal appointments for today
  const todayPersonalAppts = personalAppointments.filter(a => a.date === todayStr && a.status !== 'cancelled');

  const handleAccept = async (id) => {
    try { await acceptAppointment(id); toast.success('Appointment accepted'); }
    catch (err) { toast.error('Failed to accept'); }
  };
  const handleReject = async (id) => {
    try { await rejectAppointment(id); toast.success('Appointment rejected'); }
    catch (err) { toast.error('Failed to reject'); }
  };
  const handleComplete = async (id) => {
    try { await completeAppointment(id); toast.success('Appointment completed'); }
    catch (err) { toast.error('Failed to complete'); }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || isNaN(withdrawAmount) || withdrawAmount < 100) {
      toast.error('Minimum withdrawal is ₹100');
      return;
    }
    if (withdrawAmount > (user?.earnings || 0)) {
      toast.error('Insufficient earnings');
      return;
    }
    setWithdrawing(true);
    try {
      const res = await axiosInstance.post('/payment/withdrawal', { amount: Number(withdrawAmount) });
      toast.success(res.data.message);
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      updateProfile({ earnings: res.data.newBalance });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request withdrawal');
    } finally {
      setWithdrawing(false);
    }
  };

  const handlePaySubscription = async () => {
    if ((user?.credits || 0) < 500) {
      toast.error('You need at least ₹500 credits. Please buy credits first.');
      navigate('/doctor/buy-credits');
      return;
    }
    setPayingSub(true);
    try {
      const res = await axiosInstance.post('/payment/subscription');
      toast.success(res.data.message);
      setSubStatus('paid');
      updateProfile({
        credits: res.data.credits,
        subscriptionStatus: 'paid',
        subscriptionPaidDate: res.data.subscriptionPaidDate
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to pay subscription');
    } finally {
      setPayingSub(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Subscription Warning Banner */}
      {subStatus === 'unpaid' && (
        <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-5 text-white animate-slide-up flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Platform Subscription Required</h3>
              <p className="text-red-100 text-sm">Pay ₹500/month to accept appointments. Your credits: ₹{user?.credits || 0}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/doctor/buy-credits')}
              className="px-4 py-2 bg-white/20 rounded-xl text-sm font-semibold hover:bg-white/30 transition-colors"
            >
              Buy Credits
            </button>
            <button
              onClick={handlePaySubscription}
              disabled={payingSub}
              className="px-5 py-2 bg-white text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors disabled:opacity-70"
            >
              {payingSub ? 'Processing...' : 'Pay ₹500 Now'}
            </button>
          </div>
        </div>
      )}

      {/* Welcome with 3D depth */}
      <div className="bg-gradient-to-r from-accent-600 via-accent-500 to-primary-500 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden animate-slide-up-3d">
        {/* 3D decorative elements */}
        <div className="absolute top-0 right-0 w-52 h-52 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/4 animate-morph-bg" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 animate-breathe" />
        {/* Floating medical icons */}
        <div className="absolute top-6 right-8 opacity-20 animate-float">
          <Stethoscope className="w-14 h-14" />
        </div>
        <div className="absolute bottom-6 right-20 opacity-15 animate-float" style={{ animationDelay: '1.5s' }}>
          <Heart className="w-8 h-8" />
        </div>
        <div className="absolute top-1/2 right-40 opacity-10 animate-float" style={{ animationDelay: '3s' }}>
          <Activity className="w-10 h-10" />
        </div>
        <div className="relative z-10">
          <p className="text-accent-100 text-sm">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">
            Good {new Date().getHours() < 12 ? 'Morning' : 'Afternoon'}, Dr. {user?.name?.split(' ').pop() || 'Doctor'}! 🩺
          </h1>
          <p className="text-accent-100 text-sm mt-2">
            You have {pendingAppts.length} pending and {confirmedAppts.length} confirmed appointments.
          </p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => navigate('/doctor/profile')}
              className="px-5 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-sm font-semibold transition-all flex items-center gap-2 border border-white/20"
            >
              <Users className="w-4 h-4" />
              Edit Profile
            </button>
            <button
              onClick={() => navigate('/doctor/appointments')}
              className="px-5 py-2 bg-white text-primary-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all shadow-lg shadow-black/5"
            >
              View Schedule
            </button>
          </div>
        </div>
        {/* Animated ECG line */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center opacity-10">
          <svg width="300" height="30" viewBox="0 0 300 30" className="text-white">
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              points="0,15 50,15 60,5 70,25 80,15 100,15 110,3 120,27 130,15 200,15 210,5 220,25 230,15 300,15"
              className="animate-pulse-soft"
            />
          </svg>
        </div>
      </div>

      {/* Stats Row 1 - Appointments */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Appointments" value={myAppts.length} icon={Calendar} color="primary" trend={8} onClick={() => navigate('/doctor/appointments')} />
        <StatCard title="My Patients" value={uniquePatients} icon={Users} color="accent" trend={12} onClick={() => navigate('/doctor/patients')} />
        <StatCard title="Pending" value={pendingAppts.length} icon={Clock} color="amber" onClick={() => navigate('/doctor/appointments')} />
        <StatCard title="Completed" value={myAppts.filter(a => a.status === 'completed').length} icon={Activity} color="purple" trend={5} onClick={() => navigate('/doctor/appointments')} />
      </div>

      {/* Stats Row 2 - Financial */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Credits Balance */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group hover:border-amber-200 transition-all duration-300">
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <Coins className="w-5 h-5" />
            </div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${subStatus === 'paid' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {subStatus === 'paid' ? '✅ Subscribed' : '❌ Unpaid'}
            </span>
          </div>
          <p className="text-slate-500 text-sm font-medium mb-1">My Credits</p>
          <h3 className="text-2xl font-bold text-slate-800">₹{user?.credits || 0}</h3>
          <button
            onClick={() => navigate('/doctor/buy-credits')}
            className="mt-3 w-full py-1.5 bg-amber-50 text-amber-600 text-xs font-semibold rounded-lg hover:bg-amber-100 transition-colors"
          >
            Buy Credits
          </button>
        </div>

        {/* Earnings */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group hover:border-green-200 transition-all duration-300">
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-green-50 text-green-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <p className="text-slate-500 text-sm font-medium mb-1">My Earnings</p>
          <h3 className="text-2xl font-bold text-slate-800">₹{user?.earnings || 0}</h3>
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="mt-3 w-full py-1.5 bg-green-50 text-green-600 text-xs font-semibold rounded-lg hover:bg-green-100 transition-colors"
          >
            Withdraw Funds
          </button>
        </div>

        {/* Subscription Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group hover:border-primary-200 transition-all duration-300">
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
              <Shield className="w-5 h-5" />
            </div>
          </div>
          <p className="text-slate-500 text-sm font-medium mb-1">Platform Fee</p>
          <h3 className="text-2xl font-bold text-slate-800">₹500<span className="text-sm font-normal text-slate-400">/mo</span></h3>
          {subStatus === 'paid' ? (
            <p className="mt-3 w-full py-1.5 text-center bg-green-50 text-green-600 text-xs font-semibold rounded-lg">
              ✅ Paid This Month
            </p>
          ) : (
            <button
              onClick={handlePaySubscription}
              disabled={payingSub}
              className="mt-3 w-full py-1.5 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-70"
            >
              {payingSub ? 'Processing...' : 'Pay Now'}
            </button>
          )}
        </div>
      </div>

      {/* Two-Column Layout for Schedule */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Today's Professional Schedule */}
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Stethoscope className="w-4 h-4 text-primary-600" />
            </div>
            Work Schedule (Patients)
            {todayAppts.length > 0 && (
              <span className="px-2 py-0.5 bg-primary-600 text-white text-xs font-bold rounded-full">
                {todayAppts.length}
              </span>
            )}
          </h2>
          {loading ? (
            <div className="space-y-4">
              <SkeletonCard />
            </div>
          ) : todayAppts.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-8 text-center">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-medium">No patients scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todayAppts.map((apt, i) => (
                <div key={apt.id || apt._id} className="animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
                  <AppointmentCard
                    appointment={apt}
                    role="doctor"
                    onAccept={handleAccept}
                    onReject={handleReject}
                    onComplete={handleComplete}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Personal Appointments */}
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <div className="p-2 bg-accent-100 rounded-lg">
              <Heart className="w-4 h-4 text-accent-600" />
            </div>
            Personal Appointments (As Patient)
            {todayPersonalAppts.length > 0 && (
              <span className="px-2 py-0.5 bg-accent-600 text-white text-xs font-bold rounded-full">
                {todayPersonalAppts.length}
              </span>
            )}
          </h2>
          {loading ? (
            <div className="space-y-4">
              <SkeletonCard />
            </div>
          ) : todayPersonalAppts.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-8 text-center">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-medium">No personal appointments for today</p>
              <button
                onClick={() => navigate('/patient/find-doctor')}
                className="mt-4 text-xs font-bold text-primary-600 hover:underline"
              >
                + Book a checkup for yourself
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {todayPersonalAppts.map((apt, i) => (
                <div key={apt._id} className="animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
                  {/* Simplified personal card */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <img
                      src={apt.doctorId?.image || `https://api.dicebear.com/9.x/avataaars/svg?seed=${apt.doctorId?.name}`}
                      alt=""
                      className="w-12 h-12 rounded-xl bg-slate-100"
                    />
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-800 text-sm">Consultation with Dr. {apt.doctorId?.name}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[11px] text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {apt.slot}</span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 uppercase font-bold text-accent-600">{apt.status}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/doctor/personal-appointments`)}
                      className="px-3 py-1.5 bg-slate-50 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending Requests */}
      {pendingAppts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            Pending Requests
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full animate-pulse-soft">
              {pendingAppts.length}
            </span>
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {pendingAppts.map((apt, i) => (
              <div key={apt.id || apt._id} className="animate-slide-up-3d" style={{ animationDelay: `${i * 80}ms` }}>
                <AppointmentCard
                  appointment={apt}
                  role="doctor"
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 animate-slide-up">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Withdraw Earnings</h3>
            <p className="text-sm text-slate-500 mb-6">Enter the amount you wish to withdraw. Admin will transfer it to your QR code payment account.</p>

            <div className="mb-6">
              <label className="text-xs font-medium text-slate-500 mb-2 block">Amount to Withdraw (₹)</label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-200"
                placeholder="e.g. 500"
                max={user?.earnings || 0}
              />
              <p className="text-xs text-slate-400 mt-2">Available Earnings: ₹{user?.earnings || 0}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                disabled={withdrawing}
                className="flex-1 px-4 py-2 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-70"
              >
                {withdrawing ? 'Processing...' : 'Request Withdrawal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
