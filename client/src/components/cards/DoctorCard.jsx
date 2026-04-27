import { useRef } from 'react';
import { Star, MapPin, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import useAuthStore from '../../store/useAuthStore';
import toast from 'react-hot-toast';

export default function DoctorCard({ doctor, showBookButton = true }) {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const { user } = useAuthStore();

  const isOwnProfile = user?.role === 'doctor' && (user?._id === (doctor.id || doctor._id));

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 18;
    const rotateY = (centerX - x) / 18;
    card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`;
    card.style.boxShadow = `${(x - centerX) / 10}px ${(y - centerY) / 10}px 25px rgba(37,99,235,0.08), 0 4px 16px rgba(0,0,0,0.04)`;
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
      cardRef.current.style.boxShadow = '0 1px 8px rgba(0,0,0,0.04)';
    }
  };

  const handleViewProfile = (e) => {
    if (e) e.stopPropagation();
    if (isOwnProfile) {
      navigate('/doctor/profile');
    } else {
      navigate(`/patient/doctor/${doctor.id || doctor._id}`);
    }
  };

  const handleBookNow = (e) => {
    if (e) e.stopPropagation();
    if (isOwnProfile) {
      toast.error("You cannot book an appointment with yourself!");
      return;
    }
    navigate(`/patient/book/${doctor.id || doctor._id}`);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleViewProfile}
      className={`bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-slate-100/80 hover:border-primary-100 transition-all duration-300 group animate-slide-up-3d cursor-pointer ${isOwnProfile ? 'border-primary-200 ring-2 ring-primary-50' : ''}`}
      style={{ transformStyle: 'preserve-3d', transition: 'transform 0.2s ease-out, box-shadow 0.3s ease' }}
    >
      <div className="flex items-start gap-4" style={{ transform: 'translateZ(8px)' }}>
        <div className="relative">
          <img
            src={doctor.image}
            alt={doctor.name}
            className="w-16 h-16 rounded-2xl object-cover bg-slate-100 group-hover:scale-110 transition-transform duration-500 shadow-md"
          />
          {doctor.available && (
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse-soft" />
          )}
          {isOwnProfile && (
            <span className="absolute -top-2 -left-2 px-1.5 py-0.5 bg-primary-600 text-white text-[10px] font-bold rounded-md shadow-sm">YOU</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 truncate group-hover:text-primary-600 transition-colors duration-300">
            {doctor.name}
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">{doctor.specialization || doctor.category}</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-sm font-medium text-slate-700">{Number(doctor.averageRating || doctor.rating || 0).toFixed(1)}</span>
              <span className="text-xs text-slate-400">({doctor.totalRatings || doctor.reviews || 0})</span>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs">{doctor.experience} yrs</span>
            </div>
          </div>
        </div>
        <div className="text-right space-y-0.5" style={{ transform: 'translateZ(12px)' }}>
          {doctor.onlineFee ? (
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-primary-500 uppercase tracking-wider">Online</span>
              <span className="text-sm font-bold text-slate-800">₹{doctor.onlineFee}</span>
            </div>
          ) : null}
          {doctor.offlineFee ? (
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-accent-500 uppercase tracking-wider">Offline</span>
              <span className="text-sm font-bold text-slate-800">₹{doctor.offlineFee}</span>
            </div>
          ) : (doctor.fee || doctor.fees) ? (
            <p className="text-lg font-bold text-primary-600">₹{doctor.fee || doctor.fees}</p>
          ) : null}
        </div>
      </div>
      {showBookButton && (
        <div className="mt-4 flex gap-2" style={{ transform: 'translateZ(6px)' }}>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 hover:-translate-y-0.5 active:translate-y-0 transition-transform duration-200"
            onClick={(e) => { e.stopPropagation(); handleViewProfile(); }}
          >
            View Profile
          </Button>
          {!isOwnProfile && (
            <Button
              size="sm"
              className="flex-1 hover:-translate-y-0.5 active:translate-y-0 transition-transform duration-200 hover:shadow-md hover:shadow-primary-200/40"
              onClick={(e) => { e.stopPropagation(); handleBookNow(); }}
            >
              Book Now
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
