import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, FileText, MessageCircle, ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button';
import axiosInstance from '../../api/axiosInstance';

export default function PatientDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patientDetails, setPatientDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatientDetails = async () => {
      try {
        const res = await axiosInstance.get(`/doctor/patient/${id}`);
        setPatientDetails(res.data);
      } catch (error) {
        console.error('Failed to fetch patient details:', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchPatientDetails();
    }
  }, [id]);

  if (loading) {
    return <div className="text-center py-20 text-sm text-slate-400">Loading patient details...</div>;
  }

  if (!patientDetails) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 mb-4">Patient not found.</p>
        <Button onClick={() => navigate(-1)} variant="outline">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Patients
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-slide-up">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:justify-between border-b border-slate-100 pb-6">
          <div className="flex items-center gap-4">
            <img
              src={patientDetails.profile.image || `https://api.dicebear.com/9.x/avataaars/svg?seed=${patientDetails.profile.name}`}
              alt="Patient"
              className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200"
            />
            <div>
              <h3 className="font-bold text-slate-800 text-xl">{patientDetails.profile.name}</h3>
              <p className="text-sm text-slate-500">{patientDetails.profile.email}</p>
              <p className="text-sm text-slate-500">{patientDetails.profile.phone}</p>
            </div>
          </div>
          <div className="mt-4 sm:mt-0 w-full sm:w-auto">
            <Button
              className="w-full sm:w-auto"
              icon={MessageCircle}
              onClick={() => navigate(`/doctor/chat?userId=${patientDetails.profile._id}`)}
            >
              Message Patient
            </Button>
          </div>
        </div>

        <div className="mt-6 space-y-8">
          <div>
            <h4 className="font-semibold text-slate-700 flex items-center gap-2 mb-4 text-lg">
              <Calendar className="w-5 h-5 text-primary-500" /> Appointment History
            </h4>
            {patientDetails.appointmentHistory.length === 0 ? (
              <p className="text-sm text-slate-400 bg-slate-50 p-4 rounded-xl">No previous appointments.</p>
            ) : (
              <div className="space-y-3">
                {patientDetails.appointmentHistory.map(apt => (
                  <div key={apt._id} className="bg-slate-50 p-4 rounded-xl text-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-semibold text-slate-800 text-base">{apt.date}</span>
                        <p className="text-sm font-medium text-primary-600 mt-0.5">{apt.slot}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${apt.status === 'completed' ? 'bg-green-100 text-green-700 border border-green-200'
                        : apt.status === 'cancelled' || apt.status === 'rejected' ? 'bg-red-100 text-red-700 border border-red-200'
                          : 'bg-amber-100 text-amber-700 border border-amber-200'
                        }`}>
                        {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                      </span>
                    </div>
                    {apt.symptoms && (
                      <div className="mt-3 pt-3 border-t border-slate-200/60">
                        <p className="text-xs text-slate-500 font-medium mb-1">Symptoms:</p>
                        <p className="text-sm text-slate-700">{apt.symptoms}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="font-semibold text-slate-700 flex items-center gap-2 mb-4 text-lg">
              <FileText className="w-5 h-5 text-primary-500" /> Uploaded Reports
            </h4>
            {patientDetails.reports.length === 0 ? (
              <p className="text-sm text-slate-400 bg-slate-50 p-4 rounded-xl">No uploaded reports.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {patientDetails.reports.map(report => (
                  <a
                    key={report._id}
                    href={report.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl hover:bg-primary-50 hover:border-primary-200 transition-all border border-slate-100 group"
                  >
                    <div className="p-2 bg-white rounded-lg group-hover:bg-primary-100 transition-colors">
                      <FileText className="w-5 h-5 text-primary-500 flex-shrink-0" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-slate-700 line-clamp-1">{report.title}</span>
                      <span className="text-xs text-slate-400 block mt-0.5">Click to view file</span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
