import { useState } from 'react';
import { User, Mail, Phone, Award, Clock, Save, Camera, Plus, X } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import axiosInstance from '../../api/axiosInstance';

import { useNavigate } from 'react-router-dom';

export default function DoctorProfilePage() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuthStore();
  const isProfileIncomplete = !(user?.category && user?.experience && user?.onlineFee && user?.offlineFee && user?.address && user?.qrCode);
  const [editing, setEditing] = useState(isProfileIncomplete);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    specialization: user?.category || 'General Medicine',
    experience: user?.experience || '',
    education: user?.education || '',
    about: user?.about || '',
    onlineFee: user?.onlineFee || '',
    offlineFee: user?.offlineFee || '',
    address: user?.address || '',
    qrCode: user?.qrCode || '',
    autopayEnabled: user?.autopayEnabled || false,
    image: user?.image || ''
  });
  const [slots, setSlots] = useState(['09:00 AM', '10:00 AM', '11:30 AM', '02:00 PM', '03:30 PM', '05:00 PM']);
  const [newSlot, setNewSlot] = useState('');
  const [selectedDays, setSelectedDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const addSlot = () => {
    if (newSlot && !slots.includes(newSlot)) {
      setSlots([...slots, newSlot].sort());
      setNewSlot('');
    }
  };

  const removeSlot = (slot) => {
    setSlots(slots.filter((s) => s !== slot));
  };

  const handleSave = async () => {
    if (!form.onlineFee || !form.offlineFee) {
      toast.error('Both online and offline fees are compulsory!');
      return;
    }
    try {
      const profileData = {
        category: form.specialization,
        experience: form.experience,
        education: form.education,
        about: form.about,
        onlineFee: form.onlineFee,
        offlineFee: form.offlineFee,
        address: form.address,
        qrCode: form.qrCode,
        autopayEnabled: form.autopayEnabled,
        image: form.image,
        availableSlots: slots,
        availableDays: selectedDays
      };

      const res = await axiosInstance.put('/doctor/profile', profileData);
      updateProfile(res.data);
      setEditing(false);
      toast.success('Profile updated successfully!');
      if (isProfileIncomplete) {
        navigate('/doctor');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Doctor Profile</h1>
        <p className="text-sm text-slate-500">Manage your profile and availability</p>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-slide-up">
        <div className="h-28 bg-gradient-to-r from-accent-500 to-primary-500 relative" />
        <div className="px-6 pb-6 -mt-12">
          <div className="relative w-fit">
            <img
              src={form.image || user?.image || 'https://api.dicebear.com/9.x/avataaars/svg?seed=Doctor&backgroundColor=b6e3f4'}
              alt="Avatar"
              className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg bg-white object-cover"
            />
            <label className="absolute bottom-0 right-0 p-1.5 bg-accent-600 rounded-lg text-white hover:bg-accent-700 transition-colors cursor-pointer shadow-lg">
              <Camera className="w-3.5 h-3.5" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setForm({ ...form, image: reader.result });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>
          </div>
          <div className="mt-3">
            <h2 className="text-xl font-bold text-slate-800">{form.name}</h2>
            <p className="text-sm text-accent-600">{form.specialization}</p>
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-slate-800">Personal Information</h3>
          <Button variant={editing ? 'ghost' : 'outline'} size="sm" onClick={() => setEditing(!editing)}>
            {editing ? 'Cancel' : 'Edit'}
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { key: 'name', label: 'Full Name', icon: User, type: 'text' },
            { key: 'email', label: 'Email', icon: Mail, type: 'email' },
            { key: 'phone', label: 'Phone', icon: Phone, type: 'tel' },
            { key: 'specialization', label: 'Specialization', icon: Award, type: 'select' },
            { key: 'experience', label: 'Experience (years)', icon: Clock, type: 'number' },
            { key: 'education', label: 'Education / Degree', icon: Award, type: 'text' },
            { key: 'address', label: 'Clinic Address', icon: User, type: 'text' },
            { key: 'onlineFee', label: 'Online Consultation Fee (₹)', icon: Award, type: 'number' },
            { key: 'offlineFee', label: 'Offline Consultation Fee (₹)', icon: Award, type: 'number' },
          ].map(({ key, label, icon: Icon, type }) => (
            <div key={key}>
              <label className="text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                <Icon className="w-3 h-3" /> {label}
              </label>
              {editing ? (
                type === 'select' ? (
                  <select
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all"
                  >
                    <option value="General Medicine">General Medicine</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Psychiatry">Psychiatry</option>
                    <option value="Radiology">Radiology</option>
                    <option value="Surgery">Surgery</option>
                    <option value="Urology">Urology</option>
                  </select>
                ) : (
                  <input
                    type={type}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all"
                  />
                )
              ) : (
                <p className="text-sm font-medium text-slate-700 py-2">
                  {['onlineFee', 'offlineFee'].includes(key)
                    ? `₹${form[key]}`
                    : key === 'experience'
                      ? `${form[key]} years`
                      : form[key]}
                </p>
              )}
            </div>
          ))}

          <div className="sm:col-span-2 mt-2">
            <label className="text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
              <Camera className="w-3 h-3" /> Payment QR Code (for receiving fees)
            </label>
            {editing ? (
              <div className="flex items-center gap-4">
                {form.qrCode ? (
                  <img src={form.qrCode} alt="QR Code" className="w-20 h-20 rounded-xl border border-slate-200 object-cover" />
                ) : (
                  <div className="w-20 h-20 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-xs text-center p-2 border border-dashed border-slate-300">No QR</div>
                )}
                <label className="cursor-pointer bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                  Upload QR Image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setForm({ ...form, qrCode: reader.result });
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
            ) : form.qrCode ? (
              <img src={form.qrCode} alt="QR Code" className="w-24 h-24 rounded-xl border border-slate-200 object-cover mt-2" />
            ) : (
              <p className="text-sm font-medium text-slate-700 py-2">Not provided</p>
            )}
          </div>
        </div>
        {editing && (
          <div className="mt-4">
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">About</label>
            <textarea
              value={form.about}
              onChange={(e) => setForm({ ...form, about: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm
                focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all resize-none"
            />
          </div>
        )}
        {editing && (
          <div className="mt-4 flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <p className="text-sm font-semibold text-slate-800">Autopay Subscription</p>
              <p className="text-xs text-slate-500">Pay ₹500/month to Admin to receive bookings and be recommended</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={form.autopayEnabled}
                onChange={(e) => setForm({ ...form, autopayEnabled: e.target.checked })}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        )}
      </div>

      {/* Availability */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-slide-up" style={{ animationDelay: '150ms' }}>
        <h3 className="font-semibold text-slate-800 mb-4">Availability</h3>
        <div className="mb-5">
          <label className="text-xs font-medium text-slate-500 mb-2 block">Available Days</label>
          <div className="flex flex-wrap gap-2">
            {days.map((day) => (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${selectedDays.includes(day)
                  ? 'bg-accent-500 text-white'
                  : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 mb-2 block">Time Slots</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {slots.map((slot) => (
              <div key={slot} className="flex items-center gap-1 px-3 py-1.5 bg-primary-50 rounded-lg">
                <span className="text-xs font-medium text-primary-700">{slot}</span>
                <button onClick={() => removeSlot(slot)} className="text-primary-400 hover:text-red-500 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="time"
              value={newSlot}
              onChange={(e) => setNewSlot(e.target.value)}
              className="px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm
                focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all"
            />
            <Button variant="outline" size="sm" icon={Plus} onClick={addSlot}>Add</Button>
          </div>
        </div>
      </div>

      {/* Save Button at the bottom */}
      {(editing || isProfileIncomplete) && (
        <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <Button onClick={handleSave} icon={Save} size="lg" className="w-full">
            {isProfileIncomplete ? 'Submit Profile Setup' : 'Save All Changes'}
          </Button>
        </div>
      )}
    </div>
  );
}
