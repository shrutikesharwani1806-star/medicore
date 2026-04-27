import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Shield, Calendar, MapPin, Award } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import axiosInstance from '../../api/axiosInstance';

export default function UserManagementPage() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('patients');
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes, doctorsRes] = await Promise.all([
          axiosInstance.get('/admin/users'),
          axiosInstance.get('/admin/doctors'),
        ]);
        setPatients((patientsRes.data || []).map(p => ({ ...p, role: 'patient' })));
        setDoctors((doctorsRes.data || []).map(d => ({ ...d, role: 'doctor' })));
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const allUsers = tab === 'patients' ? patients : doctors;

  const filtered = allUsers.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleViewUser = async (user) => {
    setSelectedUser(user);
    if (user.role === 'doctor') {
      setDetailsLoading(true);
      try {
        const res = await axiosInstance.get(`/doctor/public/${user._id}`);
        setUserDetails(res.data);
      } catch (error) {
        console.error('Failed to fetch doctor details:', error);
      } finally {
        setDetailsLoading(false);
      }
    } else {
      setUserDetails(user); // basic info for patient
    }
  };

  const handleBlockToggle = async (user) => {
    try {
      const res = await axiosInstance.put(`/admin/users/${user._id}`, {
        isBlocked: !user.isBlocked
      });
      // Update local state
      if (user.role === 'doctor') {
        setDoctors(doctors.map(d => d._id === user._id ? { ...d, isBlocked: !user.isBlocked } : d));
      } else {
        setPatients(patients.map(p => p._id === user._id ? { ...p, isBlocked: !user.isBlocked } : p));
      }
      toast.success(user.isBlocked ? 'User unblocked' : 'User blocked');
      if (selectedUser?._id === user._id) {
        setSelectedUser({ ...selectedUser, isBlocked: !user.isBlocked });
      }
    } catch (error) {
      toast.error('Failed to update block status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">User Management</h1>
        <p className="text-sm text-slate-500">View and manage platform users</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 animate-slide-up" style={{ animationDelay: '50ms' }}>
        {/* Tabs */}
        <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-100 w-fit">
          {['patients', 'doctors'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all cursor-pointer ${tab === t ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-500'
                }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full sm:w-80 pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-sm shadow-sm
              focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all"
          />
        </div>
      </div>

      <p className="text-sm text-slate-400 animate-slide-up">{filtered.length} {tab} found</p>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left text-xs font-medium text-slate-400 px-5 py-3">User</th>
                <th className="text-left text-xs font-medium text-slate-400 px-5 py-3 hidden sm:table-cell">Email</th>
                <th className="text-left text-xs font-medium text-slate-400 px-5 py-3 hidden md:table-cell">
                  {tab === 'patients' ? 'Phone' : 'Specialization'}
                </th>
                <th className="text-left text-xs font-medium text-slate-400 px-5 py-3">Role</th>
                <th className="text-left text-xs font-medium text-slate-400 px-5 py-3">Status</th>
                <th className="text-left text-xs font-medium text-slate-400 px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <img src={user.image || `https://api.dicebear.com/9.x/avataaars/svg?seed=${user.name}`} alt={user.name} className="w-9 h-9 rounded-xl bg-slate-100" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">{user.name}</p>
                        <p className="text-xs text-slate-400">
                          {tab === 'patients' ? (user.phone || 'N/A') : `${user.experience || 0} yrs exp`}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500 hidden sm:table-cell">{user.email}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500 hidden md:table-cell">
                    {tab === 'patients' ? user.phone : user.category}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge status={user.role === 'doctor' ? 'active' : 'confirmed'}>{user.role}</Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    {user.isBlocked ? (
                      <Badge status="rejected">Blocked</Badge>
                    ) : (
                      <Badge status={user.isActive === false ? 'pending' : 'active'}>
                        {user.isActive === false ? 'Pending' : 'Active'}
                      </Badge>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      if (user.role === 'doctor') {
                        navigate(`/admin/doctor/${user._id}`);
                      } else {
                        handleViewUser(user);
                      }
                    }}>
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      <Modal isOpen={!!selectedUser} onClose={() => { setSelectedUser(null); setUserDetails(null); }} title={`${tab === 'doctors' ? 'Doctor' : 'Patient'} Details`}>
        <div className="p-2">
          {detailsLoading ? (
            <p className="text-sm text-slate-400 text-center py-6">Loading details...</p>
          ) : userDetails ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                <img src={userDetails.image || `https://api.dicebear.com/9.x/avataaars/svg?seed=${userDetails.name}`} alt={userDetails.name} className="w-20 h-20 rounded-2xl bg-slate-100" />
                <div>
                  <h3 className="font-bold text-slate-800 text-xl">{userDetails.name}</h3>
                  <p className="text-sm text-slate-500">{userDetails.email}</p>
                  <p className="text-sm text-slate-500">{userDetails.phone || 'N/A'}</p>
                  <div className="mt-2 flex gap-2">
                    <Badge status={userDetails.role === 'doctor' ? 'active' : 'confirmed'}>{userDetails.role}</Badge>
                    {selectedUser?.isBlocked && <Badge status="rejected">Blocked</Badge>}
                  </div>
                </div>
                <div className="ml-auto">
                  <Button
                    variant={selectedUser?.isBlocked ? "outline" : "danger"}
                    size="sm"
                    onClick={() => handleBlockToggle(selectedUser)}
                  >
                    {selectedUser?.isBlocked ? 'Unblock User' : 'Block User'}
                  </Button>
                </div>
              </div>

              {userDetails.role === 'doctor' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Professional Info</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block mb-1">Specialization</span>
                        <span className="font-medium text-slate-700">{userDetails.category || 'N/A'}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block mb-1">Experience</span>
                        <span className="font-medium text-slate-700">{userDetails.experience || 0} years</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block mb-1">Consultation Fee</span>
                        <span className="font-medium text-slate-700">₹{userDetails.fees || 0}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block mb-1">Profile Status</span>
                        <span className={`font-medium ${userDetails.profileCompleted ? 'text-green-600' : 'text-amber-600'}`}>
                          {userDetails.profileCompleted ? 'Completed' : 'Incomplete'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Performance</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block mb-1">Rating</span>
                        <span className="font-medium text-amber-600 flex items-center gap-1">
                          <Award className="w-4 h-4" /> {userDetails.averageRating || 0} ({userDetails.totalRatings || 0})
                        </span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block mb-1">Total Earnings</span>
                        <span className="font-medium text-primary-600">₹{userDetails.earnings || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-red-400 text-center py-6">Failed to load details.</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
