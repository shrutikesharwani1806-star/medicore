import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart, ArrowRight, Star, Calendar, Shield, Users, Phone,
  CheckCircle, ChevronRight, Activity, Clock, Award, Stethoscope,
  Brain, Bone, Eye, Baby, Pill, MessageSquare, Sparkles
} from 'lucide-react';
import { specializations } from '../data/mockData';
import useDoctorStore from '../store/useDoctorStore';
import useAuthStore from '../store/useAuthStore';
import Doctor3DModel from '../components/ui/Doctor3DModel';
import { ScrollReveal, useParallax, useScrollProgress } from '../hooks/useScrollEffects';

// --- Cursor Follower Component ---
function CursorFollower() {
  const cursorRef = useRef(null);
  const trailRef = useRef(null);

  useEffect(() => {
    const move = (e) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = e.clientX + 'px';
        cursorRef.current.style.top = e.clientY + 'px';
      }
      if (trailRef.current) {
        setTimeout(() => {
          if (trailRef.current) {
            trailRef.current.style.left = e.clientX + 'px';
            trailRef.current.style.top = e.clientY + 'px';
          }
        }, 80);
      }
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

  return (
    <>
      <div ref={cursorRef} className="fixed w-5 h-5 bg-gradient-to-br from-primary-400/40 to-accent-400/40 rounded-full pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 mix-blend-screen hidden lg:block backdrop-blur-sm" />
      <div ref={trailRef} className="fixed w-10 h-10 border-2 border-primary-300/20 rounded-full pointer-events-none z-[9998] -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out hidden lg:block" />
    </>
  );
}

// --- Floating Particles Background ---
function FloatingParticles() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-primary-400/5 animate-drift"
          style={{
            width: `${6 + i * 3}px`,
            height: `${6 + i * 3}px`,
            left: `${10 + i * 12}%`,
            animationDelay: `${i * 2.5}s`,
            animationDuration: `${15 + i * 3}s`,
          }}
        />
      ))}
    </div>
  );
}

// --- Scroll Progress Bar ---
function ScrollProgressBar() {
  const progress = useScrollProgress();
  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-0.5">
      <div
        className="h-full bg-gradient-to-r from-primary-500 via-accent-400 to-primary-600 transition-all duration-150 ease-out shadow-sm shadow-primary-400/30"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}

// --- 3D Doctor Card ---
function DoctorCard3D({ doctor, index }) {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 12;
    const rotateY = (centerX - x) / 12;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03,1.03,1.03)`;
    card.style.boxShadow = `${(x - centerX) / 8}px ${(y - centerY) / 8}px 30px rgba(37,99,235,0.12), 0 8px 32px rgba(0,0,0,0.06)`;
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
      cardRef.current.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)';
    }
  };

  return (
    <ScrollReveal animation="slide-up-3d" delay={index * 120}>
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-slate-100/80 overflow-hidden transition-all duration-300 group"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="relative h-48 bg-gradient-to-br from-primary-100 via-accent-50 to-primary-50 flex items-end justify-center overflow-hidden">
          <div className="absolute top-4 right-4 w-20 h-20 bg-primary-200/30 rounded-full animate-breathe" />
          <div className="absolute bottom-8 left-4 w-12 h-12 bg-accent-200/30 rounded-full animate-breathe" style={{ animationDelay: '1.5s' }} />
          <img
            src={doctor.image}
            alt={doctor.name}
            className="w-32 h-32 object-cover rounded-2xl relative z-10 mb-4 border-4 border-white shadow-xl group-hover:scale-110 transition-transform duration-500"
            style={{ transform: 'translateZ(30px)' }}
          />
          {doctor.available && (
            <span className="absolute top-4 left-4 px-2.5 py-1 bg-green-500 text-white text-[10px] font-bold rounded-full z-20 shadow-sm animate-pulse-soft">
              ● Available
            </span>
          )}
        </div>
        <div className="p-5 text-center" style={{ transform: 'translateZ(20px)' }}>
          <h3 className="font-bold text-slate-800 group-hover:text-primary-600 transition-colors">{doctor.name}</h3>
          <p className="text-sm text-primary-500 font-medium mt-0.5">{doctor.specialization}</p>
          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-sm font-bold text-slate-700">{doctor.rating}</span>
            </div>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500">{doctor.experience} yrs exp</span>
            <span className="text-slate-300">|</span>
            <span className="text-sm font-bold text-accent-600">${doctor.fee}</span>
          </div>
          <Link
            to={`/patient/doctor/${doctor.id || doctor._id}`}
            className="mt-4 block w-full py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-medium rounded-xl hover:from-primary-700 hover:to-primary-600 transition-all shadow-sm shadow-primary-200 hover:shadow-md hover:shadow-primary-300/40 hover:-translate-y-0.5 active:translate-y-0 text-center"
          >
            View Profile & Book
          </Link>
        </div>
      </div>
    </ScrollReveal>
  );
}

// --- Stat Counter ---
function AnimatedCounter({ target, label, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const increment = target / 60;
        const timer = setInterval(() => {
          start += increment;
          if (start >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 20);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={ref} className="text-center group">
      <p className="text-4xl sm:text-5xl font-extrabold text-white drop-shadow-lg group-hover:scale-110 transition-transform duration-300">{count}{suffix}</p>
      <p className="text-sm text-white/70 mt-1">{label}</p>
    </div>
  );
}

// --- MAIN LANDING PAGE ---
export default function LandingPage() {
  const navigate = useNavigate();
  const { doctors: storeDoctors, fetchPublicDoctors } = useDoctorStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchPublicDoctors();
  }, [fetchPublicDoctors]);

  const topDoctors = storeDoctors.filter(d => d.approved).slice(0, 4);
  const [statsParallaxRef, statsOffset] = useParallax(0.2);
  const [heroParallaxRef, heroOffset] = useParallax(-0.15);

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <CursorFollower />
      <FloatingParticles />
      <ScrollProgressBar />

      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0.5 w-full bg-white/70 backdrop-blur-2xl border-b border-slate-100/60 z-50 px-4 lg:px-8 shadow-sm shadow-slate-100/50">
        <div className="max-w-7xl mx-auto h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-md shadow-primary-200 group-hover:shadow-lg group-hover:shadow-primary-300/40 transition-all duration-300 group-hover:scale-105">
              <Heart className="w-5 h-5 text-white fill-white animate-heartbeat" />
            </div>
            <span className="text-xl font-bold text-slate-800">Medi<span className="text-primary-600">Core</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {['Home', 'About', 'Doctors', 'Services'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-slate-500 hover:text-primary-600 transition-colors relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary-500 after:transition-all after:duration-300 hover:after:w-full">{item}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <Link
                to={user.role === 'admin' ? '/admin' : (user.role === 'doctor' && !user.isActive) ? '/patient' : user.role === 'doctor' ? '/doctor' : '/patient'}
                className="hidden sm:block text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors"
              >
                Dashboard
              </Link>
            )}
            <Link to={user ? '/patient' : '/login'} className="px-5 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-medium rounded-xl hover:from-primary-700 hover:to-primary-600 transition-all shadow-sm shadow-primary-200 hover:shadow-lg hover:shadow-primary-300/40 hover:-translate-y-0.5 active:translate-y-0">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section id="home" className="pt-24 pb-16 sm:pt-28 sm:pb-20 relative" ref={heroParallaxRef}>
        {/* Animated gradient mesh background */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-20 -left-20 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl animate-morph-bg" style={{ transform: `translateY(${heroOffset}px)` }} />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-accent-200/20 rounded-full blur-3xl animate-morph-bg" style={{ animationDelay: '5s', transform: `translateY(${heroOffset * -0.5}px)` }} />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-primary-100/15 rounded-full blur-2xl animate-breathe" />
        </div>

        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="animate-slide-up-3d">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 rounded-full text-sm text-primary-600 font-medium mb-6 animate-border-glow shadow-sm">
                <Sparkles className="w-4 h-4 animate-spin-slow" />
                #1 Healthcare Platform
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight">
                A Great Place
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-500 animate-gradient-shift"> Care </span>
                For Yourself
              </h1>
              <p className="text-lg text-slate-500 mt-5 max-w-lg leading-relaxed">
                Medical Advice & Expert Medical Treatment. Book appointments with top specialists,
                get prescriptions, and manage your health — all in one place.
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                <button
                  onClick={() => navigate('/patient/find-doctor')}
                  className="px-7 py-3.5 bg-gradient-to-r from-primary-600 to-accent-500 text-white font-semibold rounded-2xl hover:shadow-lg hover:shadow-primary-300/30 transition-all flex items-center gap-2 group cursor-pointer hover:-translate-y-1 active:translate-y-0 duration-300"
                >
                  Book Appointment
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
                </button>
                <button
                  onClick={() => navigate('/patient')}
                  className="px-7 py-3.5 border-2 border-slate-200 text-slate-700 font-semibold rounded-2xl hover:border-primary-300 hover:text-primary-600 transition-all cursor-pointer hover:-translate-y-1 active:translate-y-0 duration-300 hover:shadow-md"
                >
                  Explore Dashboard
                </button>
              </div>
              {/* Quick search bar */}
              <ScrollReveal animation="slide-up" delay={200}>
                <div className="mt-10 flex flex-col sm:flex-row gap-3 p-4 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100/80">
                  <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <Stethoscope className="w-4 h-4 text-slate-400" />
                    <select className="bg-transparent text-sm text-slate-600 flex-1 focus:outline-none cursor-pointer">
                      <option>Choose Services</option>
                      {specializations.map(s => <option key={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <input type="date" className="bg-transparent text-sm text-slate-600 flex-1 focus:outline-none" />
                  </div>
                  <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <input type="tel" placeholder="+91 XXX XXX XXXX" className="bg-transparent text-sm text-slate-600 flex-1 focus:outline-none placeholder:text-slate-300" />
                  </div>
                  <button
                    onClick={() => navigate('/patient/find-doctor')}
                    className="px-6 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-all cursor-pointer whitespace-nowrap hover:shadow-lg hover:shadow-primary-300/30 active:scale-95 duration-200"
                  >
                    Book Appointment
                  </button>
                </div>
              </ScrollReveal>
            </div>

            {/* Right - 3D Doctor Model */}
            <div className="relative hidden lg:flex items-center justify-center animate-slide-up-3d" style={{ animationDelay: '300ms' }}>
              <div className="relative w-full h-[520px] flex items-center justify-center">
                {/* Background shape */}
                <div className="absolute inset-0 bg-gradient-to-br from-accent-100/60 via-primary-50/60 to-accent-50/60 rounded-[3rem] overflow-hidden">
                  <div className="absolute top-10 right-10 w-24 h-24 bg-primary-200/30 rounded-full animate-breathe" />
                  <div className="absolute bottom-20 left-10 w-16 h-16 bg-accent-200/30 rounded-full animate-breathe" style={{ animationDelay: '1s' }} />
                  <div className="absolute top-1/2 left-1/2 w-56 h-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-primary-200/10 to-accent-200/10 animate-morph-bg" />
                </div>

                {/* 3D Doctor Model */}
                <Doctor3DModel size="lg" className="relative z-10" />

                {/* Floating stat cards */}
                <div className="absolute top-4 -left-4 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-3 flex items-center gap-3 animate-slide-in-left z-20 hover:scale-105 transition-transform duration-300 border border-white/50">
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">1520+</p>
                    <p className="text-[10px] text-slate-400">Happy Patients</p>
                  </div>
                </div>
                <div className="absolute top-1/4 -right-4 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-3 flex items-center gap-3 animate-slide-in-right z-20 hover:scale-105 transition-transform duration-300 border border-white/50" style={{ animationDelay: '600ms' }}>
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">4.9 Rating</p>
                    <p className="text-[10px] text-slate-400">127 Reviews</p>
                  </div>
                </div>
                <div className="absolute bottom-8 -left-6 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-3 flex items-center gap-3 animate-slide-in-left z-20 hover:scale-105 transition-transform duration-300 border border-white/50" style={{ animationDelay: '900ms' }}>
                  <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">Book Today</p>
                    <p className="text-[10px] text-slate-400">Instant Confirmation</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SERVICES ===== */}
      <section id="services" className="py-16 bg-slate-50/80 relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 right-0 w-72 h-72 bg-primary-100/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-100/20 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 lg:px-8 relative z-10">
          <ScrollReveal animation="slide-up-3d">
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-primary-600 mb-2 tracking-wider">OUR SERVICES</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                See What We Provide To Keep You{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-500 animate-gradient-shift">Healthy</span>
              </h2>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {specializations.slice(0, 10).map((spec, i) => (
              <ScrollReveal key={spec.id} animation="scale" delay={i * 60}>
                <Link
                  to={`/patient/find-doctor?spec=${spec.name}`}
                  className="group bg-white/80 backdrop-blur-sm rounded-2xl p-5 text-center hover:shadow-xl hover:-translate-y-2 transition-all duration-500 border border-slate-100/80 hover:border-primary-200/60 hover:bg-white block"
                >
                  <div className={`w-14 h-14 ${spec.bg} rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 group-hover:shadow-lg`}>
                    <span className={`${spec.color} text-xl`}>
                      {spec.icon === 'Heart' && <Heart className="w-6 h-6" />}
                      {spec.icon === 'Brain' && <Brain className="w-6 h-6" />}
                      {spec.icon === 'Bone' && <Bone className="w-6 h-6" />}
                      {spec.icon === 'Eye' && <Eye className="w-6 h-6" />}
                      {spec.icon === 'Baby' && <Baby className="w-6 h-6" />}
                      {spec.icon === 'Stethoscope' && <Stethoscope className="w-6 h-6" />}
                      {spec.icon === 'Pill' && <Pill className="w-6 h-6" />}
                      {spec.icon === 'Scissors' && <Activity className="w-6 h-6" />}
                      {spec.icon === 'Activity' && <Activity className="w-6 h-6" />}
                      {spec.icon === 'Smile' && <Heart className="w-6 h-6" />}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-700 group-hover:text-primary-600 transition-colors">{spec.name}</h3>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section className="py-14 bg-gradient-to-r from-primary-700 via-primary-600 to-accent-600 relative overflow-hidden" ref={statsParallaxRef}>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 animate-breathe" style={{ transform: `translateY(${statsOffset - 50}px)` }} />
          <div className="absolute bottom-0 right-1/4 w-56 h-56 bg-white/5 rounded-full translate-y-1/2 animate-breathe" style={{ animationDelay: '2s', transform: `translateY(${statsOffset * -0.7 + 50}px)` }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/3 rounded-full animate-morph-bg" />
        </div>
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
          <AnimatedCounter target={67} suffix="+" label="Expert Doctors" />
          <AnimatedCounter target={99} suffix="%" label="Satisfaction Rate" />
          <AnimatedCounter target={98} suffix="%" label="Recovery Rate" />
          <AnimatedCounter target={5000} suffix="+" label="Happy Patients" />
        </div>
      </section>

      {/* ===== TOP DOCTORS ===== */}
      <section id="doctors" className="py-16 bg-white relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-10 left-10 w-48 h-48 bg-primary-50/40 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-accent-50/40 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 lg:px-8 relative z-10">
          <ScrollReveal animation="slide-up-3d">
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-primary-600 mb-2 tracking-wider">MEET OUR EXPERTS</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                Our Top <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-500">Doctors</span>
              </h2>
              <p className="text-slate-500 mt-3 max-w-md mx-auto">Board-certified specialists providing world-class medical care</p>
            </div>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {topDoctors.map((doc, i) => (
              <DoctorCard3D key={doc.id} doctor={doc} index={i} />
            ))}
          </div>
          <ScrollReveal animation="fade" delay={500}>
            <div className="text-center mt-10">
              <Link to="/patient/find-doctor" className="inline-flex items-center gap-2 px-6 py-3 border-2 border-primary-200 text-primary-600 font-semibold rounded-2xl hover:bg-primary-50 transition-all hover:-translate-y-0.5 active:translate-y-0 duration-300 hover:shadow-md hover:border-primary-300">
                View All Doctors <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ===== WHY CHOOSE US ===== */}
      <section id="about" className="py-16 bg-slate-50/80 relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-primary-100/15 rounded-full blur-3xl animate-breathe" />
        </div>
        <div className="max-w-7xl mx-auto px-4 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <ScrollReveal animation="slide-left">
                <p className="text-sm font-semibold text-primary-600 mb-2 tracking-wider">WHY CHOOSE US</p>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-6">
                  We Provide The Best <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-500">Healthcare</span>
                </h2>
              </ScrollReveal>
              <div className="space-y-4">
                {[
                  { icon: Shield, title: 'Verified Doctors', desc: 'All doctors are verified and approved by our admin team' },
                  { icon: Clock, title: 'Instant Booking', desc: 'Book appointments in seconds with real-time availability' },
                  { icon: MessageSquare, title: 'AI Health Assistant', desc: 'Get instant health advice from our AI-powered chatbot' },
                  { icon: Award, title: '24/7 Support', desc: 'Round-the-clock assistance for all your healthcare needs' },
                ].map((item, i) => (
                  <ScrollReveal key={i} animation="slide-left" delay={i * 100}>
                    <div className="flex gap-4 p-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100/80 hover:shadow-lg hover:border-primary-100 hover:-translate-y-0.5 transition-all duration-500 group">
                      <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary-100 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                        <item.icon className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">{item.title}</h3>
                        <p className="text-sm text-slate-500 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
            <ScrollReveal animation="slide-right" delay={200}>
              <div className="relative hidden lg:flex items-center justify-center">
                <div className="w-96 h-96 bg-gradient-to-br from-primary-100/60 to-accent-100/60 rounded-[3rem] flex items-center justify-center relative">
                  <Doctor3DModel size="md" className="z-10" />
                  <div className="absolute -bottom-4 -right-4 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl p-4 border border-white/50 hover:scale-105 transition-transform duration-300">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-accent-50 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-accent-600" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-slate-800">85+</p>
                        <p className="text-xs text-slate-400">Active Doctors</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-16 bg-gradient-to-r from-primary-700 to-accent-600 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 animate-morph-bg" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4 animate-morph-bg" style={{ animationDelay: '5s' }} />
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <ScrollReveal animation="slide-up-3d">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Ready to Get Started?</h2>
            <p className="text-primary-100 text-lg mb-8 max-w-xl mx-auto">
              Join thousands of patients and doctors who trust MediCore for their healthcare needs.
            </p>
          </ScrollReveal>
          <ScrollReveal animation="scale" delay={200}>
            <div className="flex flex-wrap gap-4 justify-center">
              <button onClick={() => navigate('/patient')} className="px-8 py-3.5 bg-white text-primary-700 font-semibold rounded-2xl hover:shadow-xl transition-all cursor-pointer hover:-translate-y-1 active:translate-y-0 duration-300 active:scale-95">
                Patient Dashboard
              </button>
              <button onClick={() => navigate('/doctor')} className="px-8 py-3.5 border-2 border-white/40 text-white font-semibold rounded-2xl hover:bg-white/10 transition-all cursor-pointer hover:-translate-y-1 active:translate-y-0 duration-300 hover:border-white/60">
                Doctor Dashboard
              </button>
              <button onClick={() => navigate('/admin')} className="px-8 py-3.5 border-2 border-white/40 text-white font-semibold rounded-2xl hover:bg-white/10 transition-all cursor-pointer hover:-translate-y-1 active:translate-y-0 duration-300 hover:border-white/60">
                Admin Dashboard
              </button>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-slate-900 text-white py-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-900/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-900/20 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 lg:px-8 relative z-10">
          <ScrollReveal animation="fade">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-accent-400 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                    <Heart className="w-5 h-5 text-white fill-white" />
                  </div>
                  <span className="text-xl font-bold">Medi<span className="text-primary-400">Core</span></span>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">Modern hospital management system providing world-class healthcare solutions.</p>
              </div>
              {[
                { title: 'Quick Links', links: ['Home', 'About Us', 'Doctors', 'Services'] },
                { title: 'Panels', links: ['Patient Dashboard', 'Doctor Dashboard', 'Admin Dashboard'] },
                { title: 'Contact', links: ['support@medicore.com', '+1 234-567-8900', 'Medical City, MC 12345'] },
              ].map((col) => (
                <div key={col.title}>
                  <h4 className="font-semibold mb-3">{col.title}</h4>
                  <ul className="space-y-2">
                    {col.links.map((link) => (
                      <li key={link} className="text-sm text-slate-400 hover:text-white transition-colors cursor-pointer hover:translate-x-1 transform duration-200">{link}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-800 mt-10 pt-6 text-center text-sm text-slate-500">
              © 2026 MediCore. All rights reserved.
            </div>
          </ScrollReveal>
        </div>
      </footer>
    </div>
  );
}
