import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import useDoctorStore from '../../store/useDoctorStore';
import DoctorCard from '../../components/cards/DoctorCard';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonCard } from '../../components/ui/Skeleton';

export default function FindDoctorPage() {
  const { doctors, loading, fetchPublicDoctors } = useDoctorStore();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [selectedSpec, setSelectedSpec] = useState(searchParams.get('spec') || 'All');

  useEffect(() => {
    fetchPublicDoctors();
  }, [fetchPublicDoctors]);

  const filtered = doctors.filter((d) => {
    const matchesSearch = !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.specialization.toLowerCase().includes(search.toLowerCase());
    const matchesSpec = selectedSpec === 'All' || d.specialization === selectedSpec;
    return matchesSearch && matchesSpec;
  });

  const specializations = Array.from(new Set(doctors.filter(d => d.approved).map(d => d.specialization))).filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Find Doctors</h1>
        <p className="text-sm text-slate-500">Search and book your appointment with top specialists</p>
      </div>

      {/* Search */}
      <div className="flex gap-3 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or specialization..."
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-sm shadow-sm
              focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 transition-all"
            id="find-doctor-search"
          />
        </div>
      </div>

      {/* Spec Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none animate-slide-up" style={{ animationDelay: '150ms' }}>
        <button
          onClick={() => setSelectedSpec('All')}
          className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${selectedSpec === 'All'
            ? 'bg-primary-600 text-white shadow-sm'
            : 'bg-white text-slate-500 border border-slate-200 hover:border-primary-200'
            }`}
        >
          All Doctors
        </button>
        {specializations.map((spec, index) => (
          <button
            key={index}
            onClick={() => setSelectedSpec(spec)}
            className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${selectedSpec === spec
              ? 'bg-primary-600 text-white shadow-sm'
              : 'bg-white text-slate-500 border border-slate-200 hover:border-primary-200'
              }`}
          >
            {spec}
          </button>
        ))}
      </div>

      {/* Results */}
      <div>
        <p className="text-sm text-slate-400 mb-4">{filtered.length} doctor(s) found</p>
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No doctors found"
            description="Try adjusting your search or filter criteria"
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((doc, i) => (
              <div key={doc.id} className="animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
                <DoctorCard doctor={doc} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
