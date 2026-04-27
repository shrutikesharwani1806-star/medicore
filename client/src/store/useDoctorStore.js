import { create } from 'zustand';
import axiosInstance from '../api/axiosInstance';

const useDoctorStore = create((set, get) => ({
  doctors: [],
  pendingDoctors: [],
  loading: false,

  fetchPublicDoctors: async () => {
    set({ loading: true });
    try {
      const res = await axiosInstance.get('/doctor/public');
      // Format the data to match frontend expectations
      const formattedDoctors = (res.data || []).map(d => ({
        id: d._id,
        name: d.name,
        specialization: d.category || 'General',
        image: d.image || `https://api.dicebear.com/9.x/avataaars/svg?seed=${d.name}`,
        rating: 4.5,
        reviews: 0,
        patients: 0,
        experience: d.experience,
        fee: d.fees,
        availableSlots: d.availability?.[0]?.slots || ['09:00 AM', '10:00 AM', '11:00 AM'],
        availableDays: d.availability?.map(a => a.day) || ['Monday', 'Tuesday', 'Wednesday'],
        about: `${d.name} is a specialist in ${d.category || 'General Medicine'}.`,
        approved: d.isActive,
        available: true
      }));
      set({ doctors: formattedDoctors, loading: false });
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
      set({ doctors: [], loading: false });
    }
  },

  fetchAdminDoctors: async () => {
    set({ loading: true });
    try {
      const res = await axiosInstance.get('/admin/doctors');
      const allDoctors = (res.data || []).map(d => ({
        id: d._id,
        name: d.name,
        email: d.email,
        phone: d.phone,
        specialization: d.category || 'General',
        image: d.image || `https://api.dicebear.com/9.x/avataaars/svg?seed=${d.name}`,
        experience: d.experience,
        fee: d.fees,
        approved: d.isActive,
        date: d.createdAt,
        education: 'MD',
        appliedDate: new Date(d.createdAt).toLocaleDateString()
      }));
      set({
        doctors: allDoctors.filter(d => d.approved),
        pendingDoctors: allDoctors.filter(d => !d.approved),
        loading: false
      });
    } catch (error) {
      console.error("Failed to fetch admin doctors:", error);
      set({ loading: false });
    }
  },

  approveDoctor: async (id) => {
    try {
      await axiosInstance.put(`/admin/users/${id}`, { isActive: true });
      // Refresh lists
      await get().fetchAdminDoctors();
    } catch (error) {
      console.error("Failed to approve doctor:", error);
    }
  },

  rejectDoctor: async (id) => {
    try {
      await axiosInstance.delete(`/admin/users/${id}`);
      // Refresh lists
      await get().fetchAdminDoctors();
    } catch (error) {
      console.error("Failed to reject doctor:", error);
    }
  },

  getDoctorById: (id) => {
    return get().doctors.find((d) => d.id === id);
  },

  searchDoctors: (query) => {
    const q = query.toLowerCase();
    return get().doctors.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.specialization.toLowerCase().includes(q)
    );
  },

  filterBySpecialization: (spec) => {
    if (!spec || spec === 'All') return get().doctors;
    return get().doctors.filter((d) => d.specialization === spec);
  },
}));

export default useDoctorStore;
