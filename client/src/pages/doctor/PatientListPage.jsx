import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, User, Calendar, FileText, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import axiosInstance from '../../api/axiosInstance';

export default function PatientListPage() {
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await axiosInstance.get('/doctor/patients');
        setPatients(res.data || []);
      } catch (error) {
        // No patients yet is OK
        setPatients([]);
      }
      setLoading(false);
    };
    fetchPatients();
  }, []);

  const filtered = patients.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleViewPatient = (patientId) => {
    navigate(`/doctor/patient/${patientId}`);
  };

  return (
    <div className="space-y-6">
      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">My Patients</h1>
        <p className="text-sm text-slate-500">View and manage your patient list</p>
      </div>

      <div className="relative animate-slide-up" style={{ animationDelay: '50ms' }}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search patients..."
          className="w-full sm:w-80 pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-sm shadow-sm
            focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all"
          id="patient-search"
        />
      </div>

      {loading ? (
        <div className="text-center py-10 text-sm text-slate-400">Loading patients...</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No patients found" description="No patients match your search or no appointments yet" />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-medium text-slate-400 px-5 py-3">Patient</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-5 py-3 hidden sm:table-cell">Email</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-5 py-3 hidden md:table-cell">Phone</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-5 py-3">Role</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((patient) => (
                  <tr
                    key={patient._id}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img src={patient.image || `https://api.dicebear.com/9.x/avataaars/svg?seed=${patient.name}`} alt={patient.name} className="w-9 h-9 rounded-xl bg-slate-100" />
                        <div>
                          <p className="text-sm font-medium text-slate-700">{patient.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 hidden sm:table-cell">{patient.email}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 hidden md:table-cell">{patient.phone}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-xs font-medium">
                        Patient
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button variant="outline" size="sm" onClick={() => handleViewPatient(patient._id)}>
                        View Details
                      </Button>
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
