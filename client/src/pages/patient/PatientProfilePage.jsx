import { useState } from 'react';
import { User, Mail, Phone, Droplet, Save, Camera } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

export default function PatientProfilePage() {
  const { user, updateProfile } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    age: user?.age || '',
    gender: user?.gender || 'Male',
    bloodGroup: user?.bloodGroup || '',
    address: user?.address || '',
  });

  const handleSave = async () => {
    try {
      const res = await axiosInstance.put('/auth/profile', form);
      updateProfile(res.data);
      setEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const fields = [
    { key: 'name', label: 'Full Name', icon: User },
    { key: 'email', label: 'Email', icon: Mail },
    { key: 'phone', label: 'Phone', icon: Phone },
    { key: 'bloodGroup', label: 'Blood Group', icon: Droplet },
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">My Profile</h1>
        <p className="text-sm text-slate-500">Manage your personal information</p>
      </div>

      {/* Profile Header */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-slide-up">
        <div className="h-28 bg-gradient-to-r from-primary-500 to-accent-500 relative" />
        <div className="px-6 pb-6 -mt-12">
          <div className="relative w-fit">
            <img
              src={user?.image || `https://api.dicebear.com/9.x/avataaars/svg?seed=${form.name}&backgroundColor=b6e3f4`}
              alt="Avatar"
              className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg bg-white"
            />
            <button className="absolute bottom-0 right-0 p-1.5 bg-primary-600 rounded-lg text-white hover:bg-primary-700 transition-colors cursor-pointer">
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="mt-3">
            <h2 className="text-xl font-bold text-slate-800">{form.name}</h2>
            <p className="text-sm text-slate-500">Patient</p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-slate-800">Personal Information</h3>
          <Button
            variant={editing ? 'ghost' : 'outline'}
            size="sm"
            onClick={() => setEditing(!editing)}
          >
            {editing ? 'Cancel' : 'Edit'}
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {fields.map(({ key, label, icon: Icon }) => (
            <div key={key}>
              <label className="text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                <Icon className="w-3 h-3" /> {label}
              </label>
              {editing ? (
                <input
                  type="text"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm
                    focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all"
                />
              ) : (
                <p className="text-sm font-medium text-slate-700 py-2">{form[key]}</p>
              )}
            </div>
          ))}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Age</label>
            {editing ? (
              <input
                type="number"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all"
              />
            ) : (
              <p className="text-sm font-medium text-slate-700 py-2">{form.age} years</p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Gender</label>
            {editing ? (
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all"
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            ) : (
              <p className="text-sm font-medium text-slate-700 py-2">{form.gender}</p>
            )}
          </div>
        </div>

        {editing && (
          <Button onClick={handleSave} icon={Save} className="w-full mt-5">
            Save Changes
          </Button>
        )}
      </div>
    </div>
  );
}
