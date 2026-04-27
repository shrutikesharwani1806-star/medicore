import { useState, useEffect } from 'react';
import { Pill, Plus, Trash2, Save, FileText, AlertCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import axiosInstance from '../../api/axiosInstance';
import useAppointmentStore from '../../store/useAppointmentStore';

export default function PrescriptionPage() {
  const [prescriptions, setPrescriptions] = useState([
    { id: 1, medicine: '', dosage: '', frequency: 'Once daily', duration: '7 days', notes: '' },
  ]);
  const [patientName, setPatientName] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [savedRx, setSavedRx] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState('');
  const { appointments, fetchDoctorAppointments } = useAppointmentStore();

  useEffect(() => {
    fetchDoctorAppointments();
  }, []);

  const addPrescription = () => {
    setPrescriptions([...prescriptions, { id: Date.now(), medicine: '', dosage: '', frequency: 'Once daily', duration: '7 days', notes: '' }]);
  };

  const removePrescription = (id) => {
    if (prescriptions.length === 1) return;
    setPrescriptions(prescriptions.filter((p) => p.id !== id));
  };

  const updatePrescription = (id, field, value) => {
    setPrescriptions(prescriptions.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const handleSave = async () => {
    if (!patientName.trim()) { toast.error('Please enter patient name'); return; }
    if (!prescriptions.some(p => p.medicine.trim())) { toast.error('Add at least one medicine'); return; }

    // Find the appointment for this patient to get IDs
    const matchedApt = appointments.find(a =>
      a.patientName?.toLowerCase().includes(patientName.toLowerCase()) &&
      (a.status === 'confirmed' || a.status === 'completed')
    );

    if (matchedApt && selectedAppointment) {
      try {
        await axiosInstance.post('/prescriptions', {
          appointmentId: selectedAppointment,
          patientId: matchedApt.patientId,
          medicines: prescriptions.filter(p => p.medicine.trim()).map(p => ({
            name: p.medicine,
            dosage: p.dosage,
            frequency: p.frequency,
            duration: p.duration,
          })),
          instructions: diagnosis,
        });
        toast.success('Prescription saved to database!');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to save to database, saved locally');
      }
    }

    setSavedRx([...savedRx, { patientName, diagnosis, meds: [...prescriptions], date: new Date().toLocaleDateString() }]);
    if (!matchedApt || !selectedAppointment) toast.success('Prescription saved locally!');
    setPatientName(''); setDiagnosis(''); setSelectedAppointment('');
    setPrescriptions([{ id: 1, medicine: '', dosage: '', frequency: 'Once daily', duration: '7 days', notes: '' }]);
  };

  return (
    <div className="relative min-h-[calc(100vh-5rem)]">
      {/* Background Video */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ top: '4rem' }}>
        <video autoPlay muted loop playsInline className="w-full h-full object-cover opacity-[0.04]">
          <source src="https://cdn.pixabay.com/video/2019/10/24/28393-368753710_large.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="relative z-10 space-y-6 max-w-3xl mx-auto">
        <div className="animate-slide-up">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Write Prescription</h1>
          <p className="text-sm text-slate-500">Create and manage prescriptions for patients</p>
        </div>

        {/* Patient Info */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4 animate-slide-up">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary-500" /> Patient Details
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Patient Name *</label>
              <input type="text" value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="Enter patient name" className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Diagnosis</label>
              <input type="text" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Enter diagnosis" className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all" />
            </div>
          </div>
        </div>

        {/* Medications */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Pill className="w-4 h-4 text-accent-500" /> Medications
            </h3>
            <Button variant="outline" size="sm" icon={Plus} onClick={addPrescription}>Add Medicine</Button>
          </div>

          {prescriptions.map((rx, i) => (
            <div key={rx.id} className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4 animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Medicine #{i + 1}</span>
                {prescriptions.length > 1 && (
                  <button onClick={() => removePrescription(rx.id)} className="p-1 text-red-400 hover:text-red-600 transition-colors cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Medicine Name *</label>
                  <input type="text" value={rx.medicine} onChange={(e) => updatePrescription(rx.id, 'medicine', e.target.value)} placeholder="e.g., Amoxicillin" className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Dosage</label>
                  <input type="text" value={rx.dosage} onChange={(e) => updatePrescription(rx.id, 'dosage', e.target.value)} placeholder="e.g., 500mg" className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Frequency</label>
                  <select value={rx.frequency} onChange={(e) => updatePrescription(rx.id, 'frequency', e.target.value)} className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all">
                    <option>Once daily</option><option>Twice daily</option><option>Three times daily</option><option>As needed</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Duration</label>
                  <select value={rx.duration} onChange={(e) => updatePrescription(rx.id, 'duration', e.target.value)} className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all">
                    <option>3 days</option><option>5 days</option><option>7 days</option><option>10 days</option><option>14 days</option><option>30 days</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Notes</label>
                <textarea value={rx.notes} onChange={(e) => updatePrescription(rx.id, 'notes', e.target.value)} placeholder="Additional instructions..." rows={2} className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all resize-none" />
              </div>
            </div>
          ))}
        </div>

        <Button onClick={handleSave} size="lg" icon={Save} className="w-full">Save Prescription</Button>

        {/* Saved Prescriptions */}
        {savedRx.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-800">Recent Prescriptions</h3>
            {savedRx.map((rx, i) => (
              <div key={i} className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100 p-4 animate-slide-up">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-slate-800">{rx.patientName}</h4>
                    <p className="text-xs text-slate-400">{rx.diagnosis || 'No diagnosis'} • {rx.date}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded-full font-medium">Saved</span>
                </div>
                <div className="space-y-1">
                  {rx.meds.filter(m => m.medicine).map((m, j) => (
                    <div key={j} className="flex items-center gap-2 text-sm text-slate-600">
                      <Pill className="w-3 h-3 text-accent-500" />
                      <span className="font-medium">{m.medicine}</span>
                      <span className="text-slate-400">• {m.dosage} • {m.frequency} • {m.duration}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
