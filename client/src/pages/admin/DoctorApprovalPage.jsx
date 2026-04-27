import { useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Shield } from 'lucide-react';
import useDoctorStore from '../../store/useDoctorStore';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

export default function DoctorApprovalPage() {
  const { pendingDoctors, approveDoctor, rejectDoctor, fetchAdminDoctors } = useDoctorStore();

  useEffect(() => {
    fetchAdminDoctors();
  }, [fetchAdminDoctors]);

  const handleApprove = async (id, name) => {
    approveDoctor(id);
    toast.success(`${name} has been approved!`);
  };

  const handleReject = (id, name) => {
    rejectDoctor(id);
    toast.error(`${name} has been rejected`);
  };

  return (
    <div className="space-y-6">
      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Doctor Approvals</h1>
        <p className="text-sm text-slate-500">Review and manage doctor registration requests</p>
      </div>

      {/* Pending count */}
      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 w-fit animate-slide-up">
        <Clock className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-medium text-amber-700">{pendingDoctors.length} pending approval(s)</span>
      </div>

      {pendingDoctors.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No pending approvals"
          description="All doctor registrations have been reviewed"
        />
      ) : (
        <div className="grid gap-4">
          {pendingDoctors.map((doc, i) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6 animate-slide-up hover:shadow-md transition-all"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <img src={doc.image} alt={doc.name} className="w-16 h-16 rounded-2xl bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold text-slate-800 text-lg">{doc.name}</h3>
                  <p className="text-sm text-primary-600 font-medium">{doc.specialization}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-2">
                    <span>🎓 {doc.education}</span>
                    <span>⏱️ {doc.experience} years experience</span>
                    <span>📅 Applied: {doc.appliedDate}</span>
                  </div>
                </div>
                <div className="flex gap-2 sm:flex-col">
                  <Button
                    variant="success"
                    size="sm"
                    icon={CheckCircle}
                    onClick={() => handleApprove(doc.id, doc.name)}
                    className="flex-1 sm:flex-none"
                  >
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={XCircle}
                    onClick={() => handleReject(doc.id, doc.name)}
                    className="flex-1 sm:flex-none"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
