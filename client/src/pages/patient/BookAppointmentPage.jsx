import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, CheckCircle, User, Mail, Phone, FileText, CreditCard, Coins, AlertTriangle } from 'lucide-react';
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
    <div className="space-y-6 max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 transition-colors cursor-pointer">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Book Appointment</h1>
        <p className="text-sm text-slate-500">Fill in your details and choose a slot with {doctor.name}</p>
      </div>

      {/* Doctor Mini Card */}
      <div className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 animate-slide-up">
        <img src={doctor.image} alt={doctor.name} className="w-16 h-16 rounded-xl bg-slate-100" />
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">{doctor.name}</h3>
          <p className="text-sm text-primary-500">{doctor.specialization} • {doctor.experience} yrs</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-accent-600">₹{doctor.fee}</p>
          <p className="text-xs text-slate-400">consultation</p>
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
    </div>
  );
}
