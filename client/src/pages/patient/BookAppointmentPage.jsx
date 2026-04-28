import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, CheckCircle, User, Mail, Phone, FileText, CreditCard, Coins, AlertTriangle, Star, MessageCircle } from 'lucide-react';
import useDoctorStore from '../../store/useDoctorStore';
import useAppointmentStore from '../../store/useAppointmentStore';
import useAuthStore from '../../store/useAuthStore';
import axiosInstance from '../../api/axiosInstance';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

export default function BookAppointmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getDoctorById, fetchPublicDoctors, doctors } = useDoctorStore();
  const { bookAppointment } = useAppointmentStore();
  const { user, updateCredits } = useAuthStore();

  const [doctor, setDoctor] = useState(getDoctorById(id));
  const [step, setStep] = useState(1);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsMessage, setSlotsMessage] = useState('');
  
  const [reportUploading, setReportUploading] = useState(false);
  const [reportUrl, setReportUrl] = useState('');
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const [form, setForm] = useState({
    patientName: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    age: '',
    gender: 'Male',
    bloodGroup: 'O+',
    reason: '',
    notes: '',
    date: '',
    time: '',
    type: 'Offline',
  });
  
  // Fetch Reviews
  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;
      setReviewsLoading(true);
      try {
        const res = await axiosInstance.get(`/reviews/${id}`);
        setReviews(res.data || []);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviews();
  }, [id]);

  const isOnline = form.type === 'Online';
  const consultationFee = isOnline ? (doctor?.onlineFee || doctor?.fee || 150) : (doctor?.offlineFee || doctor?.fee || 150);
  const upfrontCost = 50; // Only booking fee is paid upfront now

  // Redirect if doctor tries to book themselves
  useEffect(() => {
    if (user?.isDoctor && user?._id === id) {
      toast.error("Doctors cannot book appointments with themselves.");
      navigate('/doctor');
    }
  }, [user, id, navigate]);

  useEffect(() => {
    if (!doctor && doctors.length === 0) {
      fetchPublicDoctors();
    }
  }, []);

  useEffect(() => {
    if (!doctor) {
      setDoctor(getDoctorById(id));
    }
  }, [doctors, id]);

  const update = (key, val) => setForm({ ...form, [key]: val });

  // Fetch real-time available slots when date changes
  useEffect(() => {
    if (form.date && id) {
      fetchAvailableSlots(form.date);
    }
  }, [form.date]);

  const fetchAvailableSlots = async (date) => {
    setSlotsLoading(true);
    setSlotsMessage('');
    setAvailableSlots([]);
    update('time', ''); // Reset selected time
    try {
      const res = await axiosInstance.get(`/doctor/available-slots/${id}?date=${date}`);
      setAvailableSlots(res.data.availableSlots || []);
      if (res.data.message) {
        setSlotsMessage(res.data.message);
      }
      if ((res.data.availableSlots || []).length === 0 && !res.data.message) {
        setSlotsMessage('All slots are booked for this date.');
      }
    } catch (error) {
      setSlotsMessage('Failed to fetch available slots');
    }
    setSlotsLoading(false);
  };

  const handleReportUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      return toast.error("File size must be less than 5MB");
    }

    const formData = new FormData();
    formData.append('chatFile', file); // Backend expects 'chatFile' as per messageRoutes.js/uploadMiddleware.js

    setReportUploading(true);
    try {
      const res = await axiosInstance.post('/messages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setReportUrl(res.data.fileUrl);
      toast.success("Medical report uploaded successfully!");
    } catch (error) {
      toast.error("Failed to upload report. Please try again.");
    } finally {
      setReportUploading(false);
    }
  };

  if (!doctor) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Doctor not found</p>
        <Button onClick={() => navigate(-1)} className="mt-4" variant="outline">Go Back</Button>
      </div>
    );
  }

  const dates = Array.from({ length: 21 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i + 1);
    const localDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return {
      value: localDateStr,
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      dayName: d.toLocaleDateString('en-US', { weekday: 'long' }),
    };
  }).filter((d) => doctor.availableDays?.includes(d.dayName)).slice(0, 10);

  const handleBook = async () => {
    if (!form.patientName || !form.phone || !form.date || !form.time) {
      toast.error('Please fill all required fields');
      return;
    }

    // Check if pending doctor
    if (user?.role === 'doctor' && !user?.isActive) {
      toast.error("Your account is pending approval. You cannot book appointments in demo mode.");
      return;
    }

    // Check credits
    if ((user?.credits || 0) < upfrontCost) {
      toast.error(`Insufficient credits! You need ₹${upfrontCost}. Current: ₹${user?.credits || 0}`);
      return;
    }

    setLoading(true);
    try {
      const result = await bookAppointment({
        doctorId: doctor.id || doctor._id,
        date: form.date,
        slot: form.time, // Appointment model expects 'slot'
        type: form.type,
        reason: form.reason,
        symptoms: form.reason,
        report: reportUrl,
      });
      // Update credits in store
      if (result?.creditsRemaining !== undefined) {
        updateCredits(result.creditsRemaining);
      }
      setLoading(false);
      setConfirmed(true);
      toast.success('Appointment request sent! Waiting for doctor approval.');
    } catch (error) {
      setLoading(false);
      toast.error(error.response?.data?.message || 'Failed to book appointment');
    }
  };

  if (confirmed) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-scale-in">
        <div className="text-center max-w-sm">
          <div className="w-24 h-24 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-6 relative">
            <CheckCircle className="w-12 h-12 text-green-500" />
            <div className="absolute inset-0 rounded-3xl border-2 border-green-300 animate-ping opacity-30" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Request Sent! 🎉</h2>
          <p className="text-sm text-slate-500 mb-2">Your appointment request with <span className="font-medium text-slate-700">{doctor.name}</span> has been sent.</p>
          <p className="text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2 mb-4">⏳ Status: <strong>Pending Doctor Approval</strong></p>
          <div className="bg-slate-50 rounded-2xl p-4 mb-6 text-sm text-slate-600 space-y-1 text-left">
            <p>👤 {form.patientName}</p>
            <p>📅 {form.date}</p>
            <p>🕐 {form.time}</p>
            <p>📋 {form.type} — {form.reason || 'General'}</p>
            {reportUrl && <p className="text-green-600 font-medium">📄 Report Attached</p>}
            <p>💰 ₹${upfrontCost} deducted from credits</p>
          </div>
          <div className="space-y-3">
            <Button onClick={() => navigate('/patient/appointments')} className="w-full">View My Appointments</Button>
            <Button onClick={() => navigate('/patient')} variant="outline" className="w-full">Back to Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-[3vh] max-w-[92vw] sm:max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 transition-colors cursor-pointer">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Book Appointment</h1>
        <p className="text-sm text-slate-500">Fill in your details and choose a slot with {doctor.name}</p>
      </div>

      {/* Doctor Mini Card - Enhanced */}
      <div className="group relative flex items-center gap-5 bg-white/70 backdrop-blur-md rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:border-primary-200 transition-all duration-500 animate-slide-up">
        <div className="relative">
          <img src={doctor.image} alt={doctor.name} className="w-20 h-20 rounded-2xl object-cover bg-slate-100 group-hover:scale-105 transition-transform duration-500 shadow-sm" />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full shadow-sm" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-slate-800">{doctor.name}</h3>
            <CheckCircle className="w-4 h-4 text-primary-500 fill-primary-50" />
          </div>
          <p className="text-sm font-medium text-primary-600 mb-1">{doctor.specialization} • {doctor.experience} yrs exp</p>
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-sm font-bold text-slate-700">{doctor.rating || '4.8'}</span>
            <span className="text-xs text-slate-400">({doctor.reviews || 0} reviews)</span>
          </div>
        </div>
        <div className="text-right">
          <div className="px-3 py-1.5 bg-accent-50 rounded-xl border border-accent-100">
            <p className="text-xl font-black text-accent-600">₹{doctor.fee || doctor.fees}</p>
            <p className="text-[10px] font-bold text-accent-500 uppercase tracking-tighter">per visit</p>
          </div>
        </div>
      </div>

      {/* Credits Warning */}
      {(user?.credits || 0) < upfrontCost && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 animate-slide-up">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-700">Insufficient Credits</p>
            <p className="text-xs text-red-600">You need ₹{upfrontCost} credits to book. Current balance: ₹{user?.credits || 0}</p>
            <Button onClick={() => navigate('/patient/buy-credits')} size="sm" variant="outline" className="mt-2">
              Buy Credits
            </Button>
          </div>
        </div>
      )}

      {/* Cost Breakdown */}
      <div className="flex items-center gap-3 bg-primary-50 border border-primary-100 rounded-xl p-3 animate-slide-up">
        <Coins className="w-5 h-5 text-primary-500" />
        <div className="flex-1 text-xs text-primary-700">
          <span className="font-medium">Upfront Cost:</span> ₹50 Booking Fee (₹{consultationFee} consultation fee to be paid after visit) = <strong>₹50 today</strong>
        </div>
        <span className="text-sm font-bold text-primary-700">Balance: ₹{user?.credits || 0}</span>
      </div>

      {/* Steps Indicator */}
      <div className="flex items-center gap-2 animate-slide-up">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= s ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
              {s}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${step >= s ? 'text-primary-600' : 'text-slate-400'}`}>
              {s === 1 ? 'Patient Info' : s === 2 ? 'Select Slot' : 'Confirm'}
            </span>
            {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-primary-400' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Patient Details */}
      {step === 1 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4 animate-slide-up">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2"><User className="w-4 h-4 text-primary-500" /> Patient Details</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Full Name *</label>
              <input type="text" value={form.patientName} onChange={(e) => update('patientName', e.target.value)} placeholder="Enter full name" className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all" required />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Phone *</label>
              <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+91 98765-43210" className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all" required />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Email</label>
              <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="patient@email.com" className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Age</label>
              <input type="number" value={form.age} onChange={(e) => update('age', e.target.value)} placeholder="25" className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Gender</label>
              <select value={form.gender} onChange={(e) => update('gender', e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all">
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Blood Group</label>
              <select value={form.bloodGroup} onChange={(e) => update('bloodGroup', e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all">
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => <option key={bg}>{bg}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Medical Report (Optional)</label>
            <div className="flex items-center gap-3">
              <input 
                type="file" 
                id="report-upload"
                className="hidden"
                onChange={handleReportUpload}
                accept=".pdf,.jpg,.jpeg,.png,.docx"
              />
              <label 
                htmlFor="report-upload" 
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                  reportUrl ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-primary-300 hover:bg-primary-50'
                }`}
              >
                {reportUploading ? (
                  <><div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /> Uploading...</>
                ) : reportUrl ? (
                  <><CheckCircle className="w-4 h-4" /> Report Attached</>
                ) : (
                  <><FileText className="w-4 h-4" /> Click to upload medical report</>
                )}
              </label>
              {reportUrl && (
                <button 
                  type="button" 
                  onClick={() => setReportUrl('')} 
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Max size 5MB. Supported: PDF, JPG, PNG, DOCX</p>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Reason for Visit</label>
            <textarea value={form.reason} onChange={(e) => update('reason', e.target.value)} placeholder="Describe your symptoms or reason..." rows={3} className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all resize-none" />
          </div>
          <Button onClick={() => { if (!form.patientName || !form.phone) { toast.error('Name and phone are required'); return; } setStep(2); }} size="lg" className="w-full">
            Continue → Select Slot
          </Button>
        </div>
      )}

      {/* Step 2: Select Date & Time */}
      {step === 2 && (
        <div className="space-y-4 animate-slide-up">
          {/* Appointment Type */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-primary-500" /> Appointment Type</h3>
            <div className="grid grid-cols-2 gap-2">
              {['Online', 'Offline'].map((type) => (
                <button key={type} onClick={() => update('type', type)} className={`py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer flex flex-col items-center ${form.type === type ? 'bg-primary-600 text-white shadow-sm' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                  <span>{type}</span>
                  <span className={`text-[10px] ${form.type === type ? 'text-primary-200' : 'text-slate-400'}`}>
                    Fee: ₹{type === 'Online' ? (doctor?.onlineFee || doctor?.fee || 150) : (doctor?.offlineFee || doctor?.fee || 150)}
                  </span>
                </button>
              ))}
            </div>
          </div>
          {/* Date */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Calendar className="w-4 h-4 text-primary-500" /> Select Date</h3>
            {dates.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">No available dates in the next 3 weeks</p>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {dates.map((d) => (
                  <button key={d.value} onClick={() => update('date', d.value)} className={`flex flex-col items-center min-w-[64px] p-3 rounded-xl transition-all cursor-pointer ${form.date === d.value ? 'bg-primary-600 text-white shadow-md shadow-primary-200' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                    <span className="text-[10px] font-medium opacity-70">{d.day}</span>
                    <span className="text-lg font-bold">{d.date}</span>
                    <span className="text-[10px] opacity-70">{d.month}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Time - fetched from API */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-primary-500" /> Select Time</h3>
            {!form.date ? (
              <p className="text-sm text-slate-400 py-4 text-center">Please select a date first</p>
            ) : slotsLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                <span className="ml-2 text-sm text-slate-500">Loading available slots...</span>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500">{slotsMessage || 'No slots available'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availableSlots.map((slot) => (
                  <button key={slot} onClick={() => update('time', slot)} className={`py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${form.time === slot ? 'bg-primary-600 text-white shadow-md shadow-primary-200' : 'bg-slate-50 text-slate-600 hover:bg-primary-50 hover:text-primary-600'}`}>
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setStep(1)} variant="outline" size="lg" className="flex-1">← Back</Button>
            <Button onClick={() => { if (!form.date || !form.time) { toast.error('Please select date and time'); return; } setStep(3); }} size="lg" className="flex-1">Continue → Review</Button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5 animate-slide-up">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2"><CreditCard className="w-4 h-4 text-primary-500" /> Review & Confirm</h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            {[
              ['Patient', form.patientName],
              ['Phone', form.phone],
              ['Email', form.email || 'N/A'],
              ['Age / Gender', `${form.age || 'N/A'} / ${form.gender}`],
              ['Blood Group', form.bloodGroup],
              ['Doctor', doctor.name],
              ['Specialization', doctor.specialization],
              ['Date', form.date],
              ['Time', form.time],
              ['Type', form.type],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between bg-slate-50 rounded-xl px-4 py-2.5">
                <span className="text-slate-400">{label}</span>
                <span className="font-medium text-slate-700">{value}</span>
              </div>
            ))}
          </div>
          {form.reason && (
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Reason for Visit</p>
              <p className="text-sm text-slate-700">{form.reason}</p>
            </div>
          )}
          <div className="bg-primary-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-primary-700">Consultation Fee</span>
              <span className="font-medium text-primary-700">₹{consultationFee} {isOnline && "(Pay Later)"}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-primary-700">Booking Fee</span>
              <span className="font-medium text-primary-700">₹50</span>
            </div>
            <div className="border-t border-primary-200 pt-2 flex justify-between items-center">
              <span className="text-primary-800 font-semibold">Total Upfront</span>
              <span className="text-2xl font-bold text-primary-700">₹{upfrontCost}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setStep(2)} variant="outline" size="lg" className="flex-1">← Back</Button>
            <Button onClick={handleBook} loading={loading} size="lg" className="flex-1">Confirm Booking</Button>
          </div>
        </div>
      )}

      {/* Stunning Reviews Section */}
      <div className="mt-12 space-y-6 animate-slide-up" style={{ animationDelay: '400ms' }}>
        <div className="flex items-center justify-between px-2">
          <div>
            <h3 className="text-xl font-bold text-slate-800">What Patients Say</h3>
            <p className="text-sm text-slate-400">Verified reviews from past consultations</p>
          </div>
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="font-bold text-slate-800">{doctor.rating || '4.8'}</span>
          </div>
        </div>

        {reviewsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <div key={i} className="h-40 bg-slate-100 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-slate-50 rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
            <MessageCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No reviews yet for {doctor.name}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {reviews.map((review, i) => (
              <div 
                key={review._id} 
                className="bg-white p-5 rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-100/50 hover:border-primary-100 transition-all duration-500 group relative"
                style={{ animationDelay: `${450 + i * 100}ms` }}
              >
                <div className="absolute top-4 right-6 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                   <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 8.44772 14.017 9V12C14.017 12.5523 13.5693 13 13.017 13H11.017C10.4647 13 10.017 12.5523 10.017 12V9C10.017 7.34315 11.3601 6 13.017 6H19.017C20.6739 6 22.017 7.34315 22.017 9V15C22.017 16.6569 20.6739 18 19.017 18H17.017C16.4647 18 16.017 18.4477 16.017 19V21H14.017ZM3 21L3 18C3 16.8954 3.89543 16 5 16H8C8.55228 16 9 15.5523 9 15V9C9 8.44772 8.55228 8 8 8H4C3.44772 8 3 8.44772 3 9V12C3 12.5523 2.55228 13 2 13H0C-0.552285 13 -1 12.5523 -1 12V9C-1 7.34315 0.343146 6 2 6H8C9.65685 6 11 7.34315 11 9V15C11 16.6569 9.65685 18 8 18H6C5.44772 18 5 18.4477 5 19V21H3Z"></path></svg>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    <img 
                      src={review.patientId?.image || `https://api.dicebear.com/9.x/avataaars/svg?seed=${review.patientId?.name}`} 
                      alt="" 
                      className="w-10 h-10 rounded-full border-2 border-primary-50 bg-slate-50"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center border-2 border-white">
                      <CheckCircle className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{review.patientId?.name || 'Verified Patient'}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} className={`w-2.5 h-2.5 ${review.rating >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed italic">"{review.comment}"</p>
                <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-primary-500 uppercase tracking-widest bg-primary-50 px-2 py-0.5 rounded-full">Verified visit</span>
                  <span className="text-[10px] text-slate-400">{new Date(review.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
