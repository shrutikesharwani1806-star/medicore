import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Clock, Users, Award, MapPin, Calendar, ArrowLeft, MessageCircle } from 'lucide-react';
import useDoctorStore from '../../store/useDoctorStore';
import useAuthStore from '../../store/useAuthStore';
import Button from '../../components/ui/Button';
import axiosInstance from '../../api/axiosInstance';

export default function DoctorProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { getDoctorById, fetchPublicDoctors, doctors, loading } = useDoctorStore();

  // Redirect if doctor tries to view their own public profile
  useEffect(() => {
    if (user?.isDoctor && user?._id === id) {
      navigate('/doctor');
    }
  }, [user, id, navigate]);

  const doctor = getDoctorById(id);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (doctors.length === 0) {
      fetchPublicDoctors();
    }
  }, [doctors.length, fetchPublicDoctors]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await axiosInstance.get(`/reviews/${id}`);
        setReviews(res.data || []);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };
    if (id) {
      fetchReviews();
    }
  }, [id]);

  if (!doctor) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Doctor not found</p>
        <Button onClick={() => navigate(-1)} className="mt-4" variant="outline">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-[3vh] max-w-[92vw] sm:max-w-3xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Doctor Header */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-slide-up">
        <div className="h-32 bg-gradient-to-r from-primary-500 to-accent-500 relative">
          <div className="absolute -bottom-12 left-6">
            <img
              src={doctor.image}
              alt={doctor.name}
              className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg bg-white"
            />
          </div>
        </div>
        <div className="pt-14 pb-6 px-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-800">{doctor.name}</h1>
              <p className="text-sm text-primary-600 font-medium">{doctor.specialization}</p>
              <p className="text-xs text-slate-400 mt-1">{doctor.education}</p>
            </div>
            <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-xl">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-sm font-bold text-amber-700">{doctor.rating}</span>
              <span className="text-xs text-amber-500">({doctor.reviews} reviews)</span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {[
              { icon: Users, value: `${doctor.patients || 0}+`, label: 'Patients' },
              { icon: Clock, value: `${doctor.experience || 0} yrs`, label: 'Experience' },
              { icon: Award, value: `₹${doctor.onlineFee || doctor.fees || 0}`, label: 'Online Fee' },
              { icon: MapPin, value: `₹${doctor.offlineFee || doctor.fees || 0}`, label: 'Offline Fee' },
            ].map((stat, i) => (
              <div key={i} className="text-center p-3 bg-slate-50 rounded-xl">
                <stat.icon className="w-5 h-5 text-primary-500 mx-auto mb-1" />
                <p className="text-sm font-bold text-slate-800">{stat.value}</p>
                <p className="text-[10px] text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>

          {doctor.address && (
            <div className="mt-6 flex items-start gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <MapPin className="w-5 h-5 text-accent-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-700">Clinic Address</p>
                <p className="text-sm text-slate-600">{doctor.address}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* About */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <h3 className="font-semibold text-slate-800 mb-3">About</h3>
        <p className="text-sm text-slate-500 leading-relaxed">{doctor.about}</p>
      </div>

      {/* Available Days */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-slide-up" style={{ animationDelay: '150ms' }}>
        <h3 className="font-semibold text-slate-800 mb-3">Available Days</h3>
        <div className="flex flex-wrap gap-2">
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
            <span
              key={day}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${doctor.availableDays?.includes(day)
                ? 'bg-accent-50 text-accent-700 border border-accent-200'
                : 'bg-slate-50 text-slate-300 border border-slate-100'
                }`}
            >
              {day.slice(0, 3)}
            </span>
          ))}
        </div>
      </div>

      {/* Available Slots */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
        <h3 className="font-semibold text-slate-800 mb-3">Available Time Slots</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {doctor.availableSlots?.map((slot) => (
            <div key={slot} className="px-3 py-2 bg-primary-50 rounded-xl text-center">
              <p className="text-xs font-medium text-primary-700">{slot}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Book CTA */}
      <div className="animate-slide-up flex gap-3" style={{ animationDelay: '250ms' }}>
        <Button
          size="xl"
          className="flex-1"
          icon={Calendar}
          onClick={() => navigate(`/patient/book/${doctor._id || doctor.id}`)}
        >
          Book Appointment
        </Button>
        <Button
          size="xl"
          variant="outline"
          className="px-6 text-primary-600 border-primary-200 hover:bg-primary-50"
          icon={MessageCircle}
          onClick={() => navigate(`/chat?userId=${doctor._id || doctor.id}`)}
        >
          Chat
        </Button>
      </div>

      {/* Reviews Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
        <h3 className="font-semibold text-slate-800 mb-4">Patient Reviews ({reviews.length})</h3>
        {reviews.length === 0 ? (
          <p className="text-sm text-slate-500">No reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review._id} className="pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={review.patientId?.image || `https://api.dicebear.com/9.x/avataaars/svg?seed=${review.patientId?.name}`}
                    alt="Patient"
                    className="w-10 h-10 rounded-full bg-slate-100"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{review.patientId?.name}</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${review.rating >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`}
                        />
                      ))}
                      <span className="text-xs text-slate-400 ml-2">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-600">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
